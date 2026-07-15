import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../api/index';
import FaceRecognitionCheckIn from './FaceRecognitionCheckIn';

export default function WebClockWidget() {
  const [time, setTime] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFaceScan, setShowFaceScan] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchAttendance();
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await attendanceApi.getMyAttendance();
      // Look for today's record
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = res.data?.attendance?.find(a => a.date.startsWith(todayStr));
      setAttendance(todayRecord || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceApi.clockOut();
      toast.success('Successfully Clocked Out');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    }
  };

  const isClockedIn = attendance && attendance.clockIn && !attendance.clockOut;

  if (loading) return null;

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
        borderRadius: 20, padding: 24, color: '#FFF',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 14, color: '#93C5FD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, fontFamily: 'monospace' }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            
            {attendance?.clockIn ? (
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                Punched In at {new Date(attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#DBEAFE' }}>Not Punched In Yet</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isClockedIn ? (
              <button 
                onClick={() => setShowFaceScan(true)}
                style={{
                  background: '#FFF', color: '#1D4ED8', border: 'none', padding: '12px 24px',
                  borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s', transform: 'scale(1)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ color: '#2563EB' }}>face</span>
                Face Check-In
              </button>
            ) : (
              <button 
                onClick={handleClockOut}
                style={{
                  background: '#EF4444', color: '#FFF', border: 'none', padding: '12px 24px',
                  borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                  transition: 'transform 0.2s', transform: 'scale(1)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined">logout</span>
                Punch Out
              </button>
            )}
          </div>
        </div>
      </div>

      <FaceRecognitionCheckIn 
        isOpen={showFaceScan} 
        onClose={() => setShowFaceScan(false)} 
        onSuccess={fetchAttendance}
      />
    </>
  );
}
