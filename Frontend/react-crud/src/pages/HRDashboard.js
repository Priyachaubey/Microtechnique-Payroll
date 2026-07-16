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
      style={{
        background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isClickable ? 'pointer' : 'default',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        if(isClickable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if(isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-card-icon" style={{ background: iconBg, width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: iconColor }}>{icon}</span>
        </div>
        {badge && <span className={`badge ${badgeClass}`} style={{ fontWeight: 600, padding: '4px 10px', borderRadius: '10px' }}>{badge}</span>}
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value}
          {isClickable && <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--gray-300)', marginLeft: 'auto' }}>arrow_forward</span>}
        </div>
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
        <div style={{ 
          marginBottom: 36, 
          background: 'linear-gradient(to right, var(--primary-900), var(--primary-700))', 
          padding: '32px', 
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.2), 0 10px 10px -5px rgba(79, 70, 229, 0.1)'
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            HR Dashboard 
            <span style={{ 
              fontSize: 13, 
              verticalAlign: 'middle', 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white',
              padding: '4px 12px',
              borderRadius: '999px',
              fontWeight: 600,
              backdropFilter: 'blur(4px)'
            }}>
              Human Resources Portal
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: 500 }}>
            Manage recruitment, compliance, and employee relations seamlessly.
          </p>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <button 
                className="btn" 
                onClick={() => navigate('/admin/recruitment')} 
                style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', height: 'auto', display: 'flex', gap: '12px', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D2FE'; e.currentTarget.style.color = '#4F46E5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
              >
                <span className="material-symbols-outlined" style={{ color: '#6366F1' }}>person_add</span> Recruitment & ATS
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/admin/compliance')} 
                style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', height: 'auto', display: 'flex', gap: '12px', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#FDE68A'; e.currentTarget.style.color = '#D97706'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
              >
                <span className="material-symbols-outlined" style={{ color: '#F59E0B' }}>gavel</span> Compliance Dashboard
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/admin/leaves')} 
                style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', height: 'auto', display: 'flex', gap: '12px', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FCE7F3'; e.currentTarget.style.borderColor = '#FBCFE8'; e.currentTarget.style.color = '#DB2777'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
              >
                <span className="material-symbols-outlined" style={{ color: '#EC4899' }}>free_cancellation</span> Manage Leaves
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/admin/attendance')} 
                style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', height: 'auto', display: 'flex', gap: '12px', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.borderColor = '#A7F3D0'; e.currentTarget.style.color = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
              >
                <span className="material-symbols-outlined" style={{ color: '#10B981' }}>schedule</span> Attendance
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
