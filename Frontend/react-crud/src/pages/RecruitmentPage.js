import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { recruitmentApi } from '../api/index';
import toast from 'react-hot-toast';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedFilterJobId, setSelectedFilterJobId] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'jobs', 'candidates'

  // Job form
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [description, setDescription] = useState('');

  // App form
  const [jobId, setJobId] = useState('');
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([
        recruitmentApi.getJobs(),
        recruitmentApi.getApplications()
      ]);
      setJobs(jRes.data || []);
      setApplications(aRes.data || []);
    } catch (err) {
      toast.error('Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const fullDescription = `**Location:** ${location}\n**Employment Type:** ${employmentType}\n**Experience Level:** ${experienceLevel}\n**Salary Range:** ${salaryRange}\n\n${description}`;
    try {
      await recruitmentApi.createJob({ title, department, description: fullDescription });
      toast.success('Job created');
      setShowJobModal(false);
      setTitle('');
      setDepartment('');
      setDescription('');
      setSalaryRange('');
      setExperienceLevel('');
      fetchData();
    } catch (err) {
      toast.error('Failed to create job');
    }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    try {
      await recruitmentApi.addApplication({ jobId: parseInt(jobId), candidateName, email, resumeUrl });
      toast.success('Candidate added');
      setShowAppModal(false);
      setCandidateName('');
      setEmail('');
      setJobId('');
      setJobTitleInput('');
      fetchData();
    } catch (err) {
      toast.error('Failed to add candidate');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await recruitmentApi.updateApplicationStatus(appId, newStatus);
      if (newStatus === 'Offered') {
        const app = applications.find(a => a.appId === appId);
        if (app && window.confirm(`Candidate ${app.candidateName} was moved to Offered!\n\nDo you want to officially assign this role and close the job posting?`)) {
          await recruitmentApi.updateJobStatus(app.jobId, 'Filled', app.candidateName);
          toast.success('Job marked as Filled!');
        }
      }
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return '#3B82F6';
      case 'Interviewing': return '#F59E0B';
      case 'Offered': return '#10B981';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <AppLayout role="admin">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>Applicant Tracking System (ATS)</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>Manage open positions and candidates</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowJobModal(true)}>Post Job</button>
            <button className="btn btn-primary" onClick={() => setShowAppModal(true)}>Add Candidate</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--gray-200)', marginBottom: 24 }}>
          {['kanban', 'jobs', 'candidates'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 0',
                cursor: 'pointer',
                fontWeight: 600,
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--gray-500)',
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'kanban' ? 'Dashboard' : tab}
            </div>
          ))}
        </div>

        {activeTab === 'kanban' && (
          <div>
            {/* Job Filter List */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--gray-700)' }}>Filter by Open Position</h2>
              {jobs.length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>No jobs posted yet. Click "Post Job" to create one.</div>
              ) : (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                  {jobs.map(job => {
                    const isSelected = selectedFilterJobId === job.jobId;
                    const isBlurred = (selectedFilterJobId !== null && !isSelected) || job.status === 'Filled';
                    return (
                      <div 
                        key={job.jobId}
                        onClick={() => setSelectedFilterJobId(isSelected ? null : job.jobId)}
                        style={{ 
                          flex: '0 0 250px', 
                          background: '#FFF', 
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--gray-200)',
                          borderRadius: 12, 
                          padding: 16, 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: isBlurred ? 0.4 : 1,
                          filter: isBlurred ? 'blur(2px)' : 'none',
                          boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {job.status === 'Filled' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--primary-color)', color: '#FFF', fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '2px 0', zIndex: 10 }}>
                            FILLED
                          </div>
                        )}
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4, marginTop: job.status === 'Filled' ? 12 : 0 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>{job.department}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Applicants</span>
                          <span style={{ background: isSelected ? 'var(--primary-color)' : '#E5E7EB', color: isSelected ? '#FFF' : 'var(--gray-700)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>
                            {applications.filter(a => a.jobId === job.jobId).length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24 }}>
              {['Applied', 'Interviewing', 'Offered', 'Rejected'].map(status => (
                <div 
                  key={status} 
                  style={{ flex: '0 0 300px', background: 'var(--gray-50)', borderRadius: 12, padding: 16, minHeight: 400 }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const appId = e.dataTransfer.getData('appId');
                    if (appId) handleStatusChange(parseInt(appId), status);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: getStatusColor(status) }}>
                      {status}
                    </h3>
                    <span style={{ background: '#E5E7EB', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {applications.filter(a => a.status === status && (selectedFilterJobId === null || a.jobId === selectedFilterJobId)).length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {applications.filter(a => a.status === status && (selectedFilterJobId === null || a.jobId === selectedFilterJobId)).map(app => {
                      const isRejected = app.status === 'Rejected';
                      const isInterviewing = app.status === 'Interviewing';
                      
                      return (
                        <div 
                          key={app.appId}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('appId', app.appId)}
                          style={{ 
                            background: '#FFF', 
                            padding: 16, 
                            borderRadius: 8, 
                            border: '1px solid var(--gray-200)', 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                            cursor: 'grab',
                            opacity: isRejected ? 0.5 : isInterviewing ? 0.7 : 1,
                            filter: isRejected ? 'blur(1px) grayscale(100%)' : isInterviewing ? 'blur(0.5px)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>{app.candidateName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>{app.jobTitle}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>drag_indicator</span>
                            Drag to move
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {jobs.map(job => (
                <div key={job.jobId} style={{ 
                  background: '#FFF', 
                  borderRadius: 12, 
                  padding: 24, 
                  border: '1px solid var(--gray-200)', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  opacity: job.status === 'Filled' ? 0.6 : 1,
                  filter: job.status === 'Filled' ? 'blur(0.5px)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {job.status === 'Filled' && (
                    <div style={{ position: 'absolute', top: 16, right: -32, background: 'var(--primary-color)', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '4px 32px', transform: 'rotate(45deg)' }}>
                      FILLED
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--gray-900)' }}>{job.title}</h3>
                  <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16, fontWeight: 600 }}>{job.department} • {job.status}</div>
                  
                  {job.status === 'Filled' && (
                    <div style={{ background: 'var(--blue-50)', color: 'var(--primary-color)', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                      Role Assigned! See Candidates tab.
                    </div>
                  )}

                  <div style={{ fontSize: 13, color: 'var(--gray-700)', whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                    {job.description}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span style={{ background: '#E5E7EB', color: 'var(--gray-700)', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                      {applications.filter(a => a.jobId === job.jobId).length} Applicants
                    </span>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <div style={{ color: 'var(--gray-500)' }}>No jobs available.</div>}
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div>
            <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid var(--gray-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Candidate Name</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Applied Role</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.appId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{app.candidateName}</td>
                      <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--gray-600)' }}>{app.email}</td>
                      <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--gray-600)' }}>{app.jobTitle}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          fontSize: 12, 
                          fontWeight: 700, 
                          background: app.status === 'Offered' ? '#D1FAE5' : app.status === 'Rejected' ? '#FEE2E2' : '#E0E7FF',
                          color: app.status === 'Offered' ? '#065F46' : app.status === 'Rejected' ? '#991B1B' : 'var(--primary-color)'
                        }}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {applications.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-500)' }}>No candidates found.</div>}
            </div>
          </div>
        )}
      </div>

      {showJobModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>Post New Job</h2>
              <button className="btn-icon" onClick={() => setShowJobModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="modal-body">
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Job Title</label>
                  <input required className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Department</label>
                    <input required className="form-input" value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input required className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, NY" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Experience</label>
                    <input className="form-input" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} placeholder="e.g. 2+ Years" />
                  </div>
                  <div>
                    <label className="form-label">Salary Range</label>
                    <input className="form-input" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} placeholder="e.g. ₹50k - ₹80k" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Job Description</label>
                  <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows="4"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAppModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>Add Candidate</h2>
              <button className="btn-icon" onClick={() => setShowAppModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddApp}>
              <div className="modal-body">
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Candidate Name</label>
                  <input required className="form-input" value={candidateName} onChange={e => setCandidateName(e.target.value)} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Email</label>
                  <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Applying for Job</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    list="job-list" 
                    value={jobTitleInput} 
                    onChange={e => {
                      setJobTitleInput(e.target.value);
                      const job = jobs.find(j => j.title === e.target.value);
                      setJobId(job ? job.jobId : '');
                    }} 
                    placeholder="Type job title..."
                  />
                  <datalist id="job-list">
                    {jobs.map(j => <option key={j.jobId} value={j.title} />)}
                  </datalist>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAppModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
