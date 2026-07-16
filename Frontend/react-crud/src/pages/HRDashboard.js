import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../AuthContext';

function MetricCard({ icon, iconBg, iconColor, label, value, badge, badgeClass, onClick }) {
  const isClickable = !!onClick;
  return (
    <div 
      className={`stat-card ${isClickable ? 'clickable' : ''}`} 
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-card-icon" style={{ background: iconBg }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: iconColor }}>{icon}</span>
        </div>
        {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gray-900)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="page-content fade-in">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            HR Dashboard 
            <span className="badge badge-purple" style={{ marginLeft: 12, fontSize: 12, verticalAlign: 'middle', background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
              Human Resources
            </span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Manage recruitment, compliance, and employee relations.</p>
        </div>

        <div className="grid grid-4 fade-in" style={{ animationDelay: '0.1s', marginBottom: 24 }}>
        <MetricCard
          icon="groups"
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
          label="Total Employees"
          value="..."
          onClick={() => navigate('/employee/all-employees')}
        />
        <MetricCard
          icon="work"
          iconBg="#ECFDF5"
          iconColor="#10B981"
          label="Open Job Positions"
          value="Manage Jobs"
          onClick={() => navigate('/admin/recruitment')}
        />
        <MetricCard
          icon="receipt_long"
          iconBg="#FEF3C7"
          iconColor="#D97706"
          label="Compliance Filings"
          value="View"
          onClick={() => navigate('/admin/compliance')}
        />
        <MetricCard
          icon="event_note"
          iconBg="#FCE7F3"
          iconColor="#DB2777"
          label="Leave Requests"
          value="Pending"
          onClick={() => navigate('/admin/leaves')}
        />
      </div>

      <div className="grid-2 fade-in" style={{ animationDelay: '0.2s', marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>quick_reference_all</span> Quick Links</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => navigate('/admin/recruitment')} style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">person_add</span> Recruitment & ATS
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/compliance')} style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">gavel</span> Compliance Dashboard
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/leaves')} style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">free_cancellation</span> Manage Leaves
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/attendance')} style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">schedule</span> Attendance Monitoring
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>info</span> Welcome to HR Space</h3>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              As an HR Administrator, this is your central hub for managing the workforce. Use the quick links to access recruitment tools, monitor compliance, and manage employee leave requests.
            </p>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6', marginTop: '12px' }}>
              For full payroll management, you may need Admin or SuperAdmin access depending on your organization's configuration.
            </p>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
