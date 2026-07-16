import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../api/attendance';
import { profileApi } from '../api/profile';
import apiClient from '../api/client';
import * as faceapi from 'face-api.js';

export default function FaceRecognitionCheckIn({ isOpen, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, scanning, match, fail
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setStatus('initializing');
      setScanProgress(0);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      // 0. Load models sequentially to prevent face-api.js internal buffer collisions
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStatus('scanning');
      setScanProgress(10);
      runRealFaceScan(mediaStream);

    } catch (err) {
      toast.error(`Camera error: ${err.name || 'Unknown'} - ${err.message || 'Cannot access camera. Ensure you are on HTTPS and have a webcam.'}`);
      console.error('Camera/Model initialization failed:', err);
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const runRealFaceScan = async (mediaStream) => {
    try {
      // 1. Fetch user profile photo
      setScanProgress(20);
      const profileRes = await profileApi.getMyProfile();
      const profilePhoto = profileRes.data.profilePhotoUrl || profileRes.data.profilephotourl;
      if (!profilePhoto) {
        throw new Error('No profile photo found. Please upload a photo in your Profile settings first.');
      }
      
      setScanProgress(40);
      
      // Fetch image with apiClient to handle blob correctly and avoid CORS/auth issues
      const empId = profileRes.data.empId || profileRes.data.empid;
      const imgResponse = await apiClient.get(`/Profile/photo/${empId}`, {
        responseType: "blob",
      });
      
      const imgBlob = imgResponse.data;
      const imgObjectUrl = URL.createObjectURL(imgBlob);
      
      const referenceImage = await faceapi.fetchImage(imgObjectUrl);
      const referenceDetection = await faceapi.detectSingleFace(
        referenceImage,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks(true).withFaceDescriptor();
      
      // Clean up the object URL
      URL.revokeObjectURL(imgObjectUrl);
      
      if (!referenceDetection) {
        throw new Error('Could not detect a face in your profile photo. Please upload a clearer photo.');
      }
      
      setScanProgress(60);
      const faceMatcher = new faceapi.FaceMatcher(referenceDetection.descriptor, 0.6);

      // 2. Scan webcam
      let matchFound = false;
      let scanAttempts = 0;
      
      const scanInterval = setInterval(async () => {
        if (!videoRef.current || !videoRef.current.videoWidth) return;
        scanAttempts++;
        
        try {
          const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks(true).withFaceDescriptor();
          
          if (detection) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            if (bestMatch.distance < 0.6) {
               matchFound = true;
            }
          }
        } catch (e) {
          console.warn('Face detection error during scan', e);
        }

        if (matchFound || scanAttempts > 20) {
          clearInterval(scanInterval);
          setScanProgress(100);
          
          if (matchFound) {
            setStatus('match');
            handlePunch();
          } else {
            toast.error('Face Verification Failed. Face does not match registered profile.');
            setStatus('fail');
            setTimeout(onClose, 2500);
          }
        }
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Face Verification Failed.');
      setStatus('fail');
      setTimeout(onClose, 2500);
    }
  };

  const handlePunch = async () => {
    try {
      await attendanceApi.clockIn();
      toast.success('Face matched! You are now Checked In.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in.');
      setStatus('fail');
      setTimeout(onClose, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999, backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: '#1F2937', padding: 32, borderRadius: 24,
        textAlign: 'center', color: '#FFF', position: 'relative',
        width: '100%', maxWidth: 450, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          color: '#9CA3AF', cursor: 'pointer'
        }}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>Biometric Verification</h2>

        <div style={{
          position: 'relative', width: 320, height: 320, margin: '0 auto 24px',
          borderRadius: '50%', overflow: 'hidden', border: `4px solid ${status === 'match' ? '#10B981' : status === 'fail' ? '#EF4444' : '#3B82F6'}`,
          boxShadow: `0 0 30px ${status === 'match' ? 'rgba(16, 185, 129, 0.4)' : status === 'fail' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
        }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
          />

          {status === 'scanning' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: '#3B82F6', boxShadow: '0 0 20px #3B82F6',
              animation: 'scan 2s infinite linear'
            }} />
          )}

          {status === 'match' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#10B981' }}>check_circle</span>
            </div>
          )}
        </div>

        <div style={{ height: 40 }}>
          {status === 'initializing' && <p style={{ color: '#9CA3AF', margin: 0 }}>Initializing camera & models...</p>}
          {status === 'scanning' && (
            <div>
              <p style={{ color: '#60A5FA', margin: '0 0 8px', fontWeight: 600 }}>Scanning face... {scanProgress}%</p>
              <div style={{ background: '#374151', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ background: '#3B82F6', height: '100%', width: `${scanProgress}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
          )}
          {status === 'match' && <p style={{ color: '#10B981', margin: 0, fontWeight: 700, fontSize: 18 }}>Identity Verified!</p>}
          {status === 'fail' && <p style={{ color: '#EF4444', margin: 0, fontWeight: 700, fontSize: 18 }}>Verification Failed</p>}
        </div>

      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
