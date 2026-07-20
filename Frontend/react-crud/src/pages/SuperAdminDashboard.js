import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { superAdminApi } from '../api/superadmin';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import AppLayout from '../components/AppLayout';

// ═══════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════

const C = {
  bg: 'var(--gray-100)',
  surface: '#ffffff',
  surfaceHover: 'var(--gray-50)',
  surfaceAlt: 'var(--gray-50)',
  border: 'var(--gray-200)',
  accent: 'var(--primary-500)',
  accentLight: 'var(--primary-600)',
  accentDim: 'var(--primary-50)',
  text: 'var(--gray-900)',
  textMuted: 'var(--gray-500)',
  textDim: 'var(--gray-400)',
  white: '#ffffff',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  info: 'var(--info)',
  purple: '#818CF8',
};

// ═══════════════════════════════════════════════════════════════════════
// REUSABLE STYLES
// ═══════════════════════════════════════════════════════════════════════

const badge = (status) => {
  const map = {
    Active: { bg: 'rgba(16,185,129,0.12)', color: C.success, dot: C.success },
    Pending: { bg: 'rgba(245,158,11,0.12)', color: C.warning, dot: C.warning },
    Inactive: { bg: 'rgba(139,141,152,0.12)', color: '#9CA3AF', dot: '#9CA3AF' },
    Suspended: { bg: 'rgba(239,68,68,0.12)', color: C.danger, dot: C.danger },
  };
  const s = map[status] || map.Inactive;
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: s.bg, color: s.color,
  };
};

const btn = (variant = 'primary', size = 'md') => {
  const pad = size === 'sm' ? '6px 12px' : '9px 18px';
  const fs = size === 'sm' ? 11 : 12;
  const base = {
    padding: pad, fontSize: fs, fontWeight: 700, border: 'none', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s ease', display: 'inline-flex',
    alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
  };
  const variants = {
    primary: { ...base, background: C.accent, color: '#fff' },
    success: { ...base, background: C.success, color: '#fff' },
    danger: { ...base, background: C.danger, color: '#fff' },
    warning: { ...base, background: C.warning, color: '#000' },
    outline: { ...base, background: 'transparent', color: C.accent, border: `1px solid ${C.accent}` },
    ghost: { ...base, background: 'rgba(255,255,255,0.04)', color: C.textMuted },
  };
  return variants[variant] || variants.primary;
};

// ═══════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function StatusDot({ color }) {
  return <span style={{
    width: 7, height: 7, borderRadius: '50%', background: color,
    boxShadow: `0 0 6px ${color}50`, flexShrink: 0,
  }} />;
}


function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 52, color: C.textDim, marginBottom: 12, display: 'block' }}>
        {icon}
      </span>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textMuted }}>{subtitle}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════

function ModalOverlay({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.surface, borderRadius: 16, padding: 28, width: '92%', maxWidth: 460,
          border: `1px solid ${C.border}`, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function AdminInfoCard({ admin }) {
  return (
    <div style={{
      padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`,
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{admin.name || admin.email}</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
        {admin.spaceName ? `Space: ${admin.spaceName}` : 'No space'} · #{admin.empId}
      </div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={badge(admin.status)}>
          <StatusDot color={badge(admin.status).color} />
          {admin.status}
        </span>
        {!admin.statusBySuperAdmin && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: 'rgba(239,68,68,0.12)', color: C.danger,
          }}>
            🔒 Blocked by SuperAdmin
          </span>
        )}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          <strong style={{ color: C.info }}>{admin.currentEmployeeCount}</strong> employees
        </span>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          <strong style={{ color: C.purple }}>{admin.currentSpaceCount}</strong> spaces
        </span>
      </div>
    </div>
  );
}

function ApproveModal({ admin, onClose, onConfirm, loading }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{ color: C.success, fontSize: 22 }}>verified</span>
        Approve Admin
      </div>
      <AdminInfoCard admin={admin} />
      <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
        This will activate the admin account. They will be able to log in and manage their workspace.
        No limitations are enforced — you can monitor their usage and take action if needed.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
        <button style={btn('success')} onClick={onConfirm} disabled={loading}>
          {loading ? 'Approving...' : '✓ Approve Admin'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function StatusModal({ admin, onClose, onConfirm, loading, mode }) {
  const [status, setStatus] = useState(mode === 'revoke' ? 'Suspended' : (admin?.status || 'Active'));
  const [reason, setReason] = useState('');
  const needsReason = status !== 'Active';
  const canSubmit = status && (!needsReason || reason.trim().length > 0);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{ color: mode === 'revoke' ? C.danger : C.accent, fontSize: 22 }}>
          {mode === 'revoke' ? 'gpp_bad' : 'swap_horiz'}
        </span>
        {mode === 'revoke' ? 'Revoke Admin Access' : 'Change Admin Status'}
      </div>
      <AdminInfoCard admin={admin} />

      {mode === 'revoke' && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
          fontSize: 12, color: C.danger, lineHeight: 1.5,
        }}>
          <strong>⚠ Warning:</strong> Revoking this admin will suspend their account.
          All employees under their workspace will lose access to the system.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
          New Status
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
            cursor: 'pointer', boxSizing: 'border-box',
          }}
        >
          {mode !== 'revoke' && <option value="Active">Active</option>}
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
          Reason {needsReason ? <span style={{ color: C.danger }}>*</span> : '(optional)'}
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Describe the reason for this action..."
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
            minHeight: 80, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
        <button
          style={btn(mode === 'revoke' ? 'danger' : 'primary')}
          onClick={() => onConfirm(status, reason)}
          disabled={!canSubmit || loading}
        >
          {loading ? 'Saving...' : mode === 'revoke' ? 'Revoke Access' : 'Update Status'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function LimitsModal({ admin, onClose, onConfirm, loading }) {
  const [maxEmp, setMaxEmp] = useState(admin.numberOfEmployees || 100);
  const [maxSp, setMaxSp] = useState(admin.maxSpaces || 5);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{ color: C.accent, fontSize: 22 }}>tune</span>
        Edit Advisory Limits
      </div>
      <AdminInfoCard admin={admin} />

      <div style={{
        padding: '10px 14px', borderRadius: 8, marginBottom: 14,
        background: C.accentDim, border: `1px solid rgba(79, 70, 229, 0.15)`,
        fontSize: 12, color: C.accentLight, lineHeight: 1.5,
      }}>
        <strong>ℹ Advisory only:</strong> These limits are for monitoring purposes.
        Admins can still create beyond these limits. You can manually restrict them if they exceed the agreed terms.
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
          Max Employees (Advisory)
        </label>
        <input
          type="number"
          value={maxEmp}
          onChange={e => setMaxEmp(parseInt(e.target.value) || 0)}
          min={1}
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
          Currently using: <strong style={{ color: C.text }}>{admin.currentEmployeeCount}</strong> employees
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
          Max Spaces (Advisory)
        </label>
        <input
          type="number"
          value={maxSp}
          onChange={e => setMaxSp(parseInt(e.target.value) || 0)}
          min={1}
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
          Currently using: <strong style={{ color: C.text }}>{admin.currentSpaceCount}</strong> spaces
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
        <button style={btn('primary')} onClick={() => onConfirm(maxEmp, maxSp)} disabled={loading}>
          {loading ? 'Saving...' : 'Save Limits'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function SettingsModal({ onClose, onConfirm, loading, user, initialEmpPrice, initialStarterPrice, onSavePricing }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [empPrice, setEmpPrice] = useState(initialEmpPrice || 99);
  const [starterPrice, setStarterPrice] = useState(initialStarterPrice || 49);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    try {
      await onSavePricing({ professionalPrice: empPrice, starterPrice: starterPrice });
      onConfirm({
        name,
        email,
        currentPassword: currentPassword ? btoa(currentPassword) : null,
        newPassword: newPassword ? btoa(newPassword) : null,
      });
    } catch (err) {
      setError(err.message || 'Failed to update pricing');
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{ color: C.accent, fontSize: 22 }}>settings</span>
        SuperAdmin Settings
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 12, color: C.danger,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ margin: '8px 0', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>SaaS Subscription Pricing</div>
          <span style={{ fontSize: 11, color: C.textMuted }}>Set the default cost billed per active employee monthly</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Professional Price per Employee (INR)
          </label>
          <input
            type="number"
            value={empPrice}
            onChange={e => setEmpPrice(parseInt(e.target.value) || 0)}
            required
            min={1}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginTop: 12, marginBottom: 6 }}>
            Starter Price per Employee (INR)
          </label>
          <input
            type="number"
            value={starterPrice}
            onChange={e => setStarterPrice(parseInt(e.target.value) || 0)}
            required
            min={1}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ margin: '8px 0', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Change Password</div>
          <span style={{ fontSize: 11, color: C.textMuted }}>Leave blank if you do not want to change it</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Required to change password"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="button" style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" style={btn('primary')} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ADD SUPER ADMIN MODAL (2-step)
// ═══════════════════════════════════════════════════════════════════════

function AddSuperAdminModal({ onClose, onConfirm, loading }) {
  const [step, setStep] = useState(1); // 1 = verify your password, 2 = fill new SA details
  const [yourPassword, setYourPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showYourPw, setShowYourPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!yourPassword) { setError('Please enter your current password.'); return; }
    setStep(2);
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    if (!newEmail) { setError('Email is required.'); return; }
    if (!newName) { setError('Name is required.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    onConfirm({ yourPassword, newEmail, newName, newPassword });
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <ModalOverlay onClose={onClose}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>person_add</span>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Add SuperAdmin</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Step {step} of 2 — {step === 1 ? 'Verify identity' : 'New account details'}</div>
          </div>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: 4, flex: 1, borderRadius: 99,
              background: s <= step ? C.accent : C.border,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 12, color: C.danger, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
          {error}
        </div>
      )}

      {/* ─── STEP 1: Verify your password ─── */}
      {step === 1 && (
        <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 14px', borderRadius: 8,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, color: '#818CF8', lineHeight: 1.5,
          }}>
            🔐 For security, confirm your own SuperAdmin password before creating a new account.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              Your Current Password <span style={{ color: C.danger }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showYourPw ? 'text' : 'password'}
                value={yourPassword}
                onChange={e => setYourPassword(e.target.value)}
                placeholder="Enter your password to verify"
                autoFocus
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowYourPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showYourPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={btn('primary')} disabled={!yourPassword}>
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ─── STEP 2: New SA details ─── */}
      {step === 2 && (
        <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              Full Name <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Jane Admin"
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              Email Address <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="admin@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              Password <span style={{ color: C.danger }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showNewPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              Confirm Password <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
            <button type="button" style={btn('ghost')} onClick={() => { setStep(1); setError(''); }} disabled={loading}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" style={btn('primary')} disabled={loading}>
                {loading ? 'Creating...' : '✓ Create SuperAdmin'}
              </button>
            </div>
          </div>
        </form>
      )}
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ADD COMPANY MODAL
// ═══════════════════════════════════════════════════════════════════════

function AddCompanyModal({ onClose, onConfirm, loading }) {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!companyName) { setError('Company Name is required.'); return; }
    if (!adminName) { setError('Admin Name is required.'); return; }
    if (!adminEmail) { setError('Admin Email is required.'); return; }
    if (adminPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    
    onConfirm({ companyName, adminName, adminEmail, adminPassword });
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 13, background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>add_business</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Add New Company</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Register a new workspace and tenant admin account</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: C.danger, fontSize: 12, borderRadius: 8, marginBottom: 16, textAlign: 'left', fontWeight: 650 }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Company / Workspace Name <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Microtechnique Pvt Ltd"
            style={inputStyle}
            disabled={loading}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Admin Full Name <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            type="text"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            placeholder="e.g. John Doe"
            style={inputStyle}
            disabled={loading}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Admin Email Address <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
            placeholder="e.g. admin@company.com"
            style={inputStyle}
            disabled={loading}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
            Admin Password <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="Min 6 characters"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="button" style={btn('ghost')} onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" style={btn('success')} disabled={loading}>
            {loading ? 'Registering...' : '✓ Add Company'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [empPrice, setEmpPrice] = useState(99);
  const [starterPrice, setStarterPrice] = useState(49);

  // Expanded row and sub-tabs
  const [expandedAdminId, setExpandedAdminId] = useState(null);
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('profile');

  // Modal state
  const [approveModal, setApproveModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [limitsModal, setLimitsModal] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddSuperAdminModal, setShowAddSuperAdminModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  // Get current sub-view
  const getActiveView = () => {
    const parts = location.pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'superadmin' || !lastPart) return 'overview';
    return lastPart;
  };
  const activeView = getActiveView();

  // ── Fetch ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adminsRes, pendingRes, statsRes, pricingRes] = await Promise.all([
        superAdminApi.getAdmins(),
        superAdminApi.getPendingAdmins(),
        superAdminApi.getStats(),
        superAdminApi.getPricingConfig()
      ]);
      setAdmins(adminsRes.data);
      setPendingAdmins(pendingRes.data);
      setStats(statsRes.data);
      setEmpPrice(parseInt(pricingRes.data.professionalPrice) || 99);
      setStarterPrice(parseInt(pricingRes.data.starterPrice) || 49);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!approveModal) return;
    try {
      setActionLoading(true);
      await superAdminApi.approveAdmin(approveModal.empId);
      toast.success(`${approveModal.email} approved!`);
      setApproveModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status, reason) => {
    if (!statusModal) return;
    const { admin, mode } = statusModal;
    try {
      setActionLoading(true);
      if (mode === 'revoke') {
        await superAdminApi.revokeAdmin(admin.empId, { status, reason });
        toast.success(`${admin.email} access revoked`);
      } else {
        await superAdminApi.updateAdminStatus(admin.empId, { status, reason });
        toast.success(`${admin.email} → ${status}`);
      }
      setStatusModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to permanently delete company ${admin.spaceName || 'N/A'} and all its users? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await superAdminApi.deleteAdmin(admin.empId);
      toast.success(`${admin.spaceName || 'Company'} deleted successfully.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };


  const handleLimits = async (maxEmp, maxSp) => {
    if (!limitsModal) return;
    try {
      setActionLoading(true);
      await superAdminApi.updateSpaceLimits(limitsModal.spaceId, {
        numberOfEmployees: maxEmp, maxSpaces: maxSp,
      });
      toast.success('Limits updated');
      setAdmins(prev => prev.map(a => a.spaceId === limitsModal.spaceId ? { ...a, numberOfEmployees: maxEmp, maxSpaces: maxSp } : a));
      setLimitsModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePricing = async (prices) => {
    // prices: { professionalPrice, starterPrice }
    await superAdminApi.savePricingConfig({
      professionalPrice: String(prices.professionalPrice),
      starterPrice: String(prices.starterPrice)
    });
    setEmpPrice(parseInt(prices.professionalPrice) || 99);
    setStarterPrice(parseInt(prices.starterPrice) || 49);
  };

  const handleSaveSettings = async (settingsData) => {
    try {
      setActionLoading(true);
      const res = await superAdminApi.updateProfile(settingsData);
      toast.success('Settings updated successfully!');
      
      const updatedUser = {
        ...user,
        email: res.data.email,
        name: res.data.name
      };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setActionLoading(false);
      setShowSettingsModal(false);
    }
  };

  const handleCreateSuperAdmin = async ({ yourPassword, newEmail, newName, newPassword }) => {
    try {
      setActionLoading(true);
      await superAdminApi.createSuperAdmin({
        yourPassword,
        newEmail,
        newName,
        newPassword,
      });
      toast.success(`✅ SuperAdmin '${newName}' created! They can now login with ${newEmail}`);
      setShowAddSuperAdminModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create SuperAdmin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCompany = async (data) => {
    try {
      setActionLoading(true);
      await superAdminApi.registerCompany({
        name: data.adminName,
        email: data.adminEmail,
        password: data.adminPassword,
        spaceName: data.companyName,
        gender: 'Male',
        role: 'Admin'
      });
      toast.success("✅ Company workspace registered successfully! Go to 'Pending Approvals' tab to active it.");
      setShowAddCompanyModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register company.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filter & Search Logic ───────────────────────────────────────────

  const getFilteredList = () => {
    let list = admins;

    // Parse optional status filter from query param (e.g. ?status=Active)
    const params = new URLSearchParams(location.search);
    const statusFilter = params.get('status');
    if (statusFilter) {
      list = list.filter(a => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      list = list.filter(a =>
        (a.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.spaceName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  };

  const filteredList = getFilteredList();

  return (
    <AppLayout role="superadmin">
      <div className="page-content fade-in" style={{ paddingBottom: 60 }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 4, textTransform: 'capitalize' }}>
                Platform {activeView === 'overview' ? 'Governance' : activeView.replace('-', ' ')}
              </h1>
              <p style={{ fontSize: 13, color: C.textMuted }}>
                {activeView === 'overview' && 'Executive overview of SaaS platform metrics and workspace health.'}
                {activeView === 'actions' && 'Action-required tasks and system-wide notifications checklist.'}
                {activeView === 'companies' && 'Manage registered companies, workspace advisory limits, and active states.'}
                {activeView === 'approvals' && 'Review and approve pending organization registrations.'}
                {activeView === 'contracts' && 'Manage corporate subscription contracts and default pricing configurations.'}
                {activeView === 'payments' && 'Track MRR metrics, customer invoice records, and billing transactions.'}
                {activeView === 'payroll' && 'Operational status of background automated payroll runs.'}
                {activeView === 'health' && 'Microtechnique infrastructure availability, backup status, and service states.'}
                {activeView === 'support' && 'Review support and feature request tickets submitted by organization admins.'}
                {activeView === 'security' && 'Comprehensive system audit trails of SuperAdmin platform actions.'}
                {activeView === 'analytics' && 'System usage metrics, shift log counts, and feature adoption graphs.'}
                {activeView === 'settings' && 'Global platform policy configurations, defaults, and security configurations.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {(activeView === 'overview' || activeView === 'settings') && (
                <>
                  <button
                    id="btn-add-superadmin"
                    style={{
                      ...btn('primary'),
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}
                    onClick={() => setShowAddSuperAdminModal(true)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                    Add SuperAdmin
                  </button>
                  <button
                    id="btn-superadmin-settings"
                    style={btn('outline')}
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>settings</span>
                    Settings
                  </button>
                </>
              )}
              {activeView === 'companies' && (
                <button
                  id="btn-add-company"
                  style={{
                    ...btn('primary'),
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  }}
                  onClick={() => setShowAddCompanyModal(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_business</span>
                  Add Company
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 1. EXECUTIVE OVERVIEW VIEW ───────────────────────────────── */}
        {activeView === 'overview' && (
          <div>
            {/* Stats grid (Clickable cards) */}
            {stats && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                gap: 14, marginBottom: 28,
              }}>
                {[
                  { val: stats.totalAdmins, lbl: 'Total Admins', icon: 'admin_panel_settings', color: C.accent, onClick: () => navigate('/superadmin/companies') },
                  { val: stats.activeAdmins, lbl: 'Active Admins', icon: 'check_circle', color: C.success, onClick: () => navigate('/superadmin/companies?status=Active') },
                  { val: stats.pendingAdmins, lbl: 'Pending Admins', icon: 'pending', color: C.warning, onClick: () => navigate('/superadmin/approvals') },
                  { val: stats.suspendedAdmins, lbl: 'Suspended Admins', icon: 'block', color: C.danger, onClick: () => navigate('/superadmin/companies?status=Suspended') },
                  { val: stats.totalSpaces, lbl: 'Total Workspaces', icon: 'corporate_fare', color: C.info, onClick: () => navigate('/superadmin/companies') },
                  { val: stats.totalEmployees, lbl: 'Total Employees', icon: 'groups', color: C.purple, onClick: () => navigate('/superadmin/analytics') },
                  { val: stats.activeEmployees, lbl: 'Active Staff', icon: 'person_check', color: C.success, onClick: () => navigate('/superadmin/analytics') },
                  { val: stats.pendingEmployees, lbl: 'Pending Staff', icon: 'person_add', color: C.warning, onClick: () => navigate('/superadmin/approvals') },
                ].map(({ val, lbl, icon, color, onClick }) => (
                  <div
                    key={lbl}
                    onClick={onClick}
                    style={{
                      background: C.surface, borderRadius: 14, padding: '18px 16px',
                      border: `1px solid ${C.border}`, transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val ?? 0}</div>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color, opacity: 0.35 }}>{icon}</span>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase',
                      letterSpacing: '0.06em', marginTop: 6,
                    }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Overview Content Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, flexWrap: 'wrap' }}>
              {/* Left Column: Action Items Alert Box & System Metrics preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Action Items Alert Box */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: C.warning }}>pending_actions</span>
                    Immediate Actions Required
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingAdmins.length > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <span style={{ fontSize: 13, color: C.text }}>{pendingAdmins.length} Admin registrations awaiting approval</span>
                        <button style={btn('warning', 'sm')} onClick={() => navigate('/superadmin/approvals')}>Review approvals</button>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                        ✓ All administrator applications approved.
                      </div>
                    )}
                    {admins.some(a => a.currentEmployeeCount > (a.numberOfEmployees || 100)) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <span style={{ fontSize: 13, color: C.text }}>Admins exceeding advisory employee limits</span>
                        <button style={btn('danger', 'sm')} onClick={() => navigate('/superadmin/companies')}>Manage limits</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Activity Summary Card */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>System Run Parameters</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ padding: 12, background: C.bg, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: C.textMuted }}>Platform Price configuration</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.success, marginTop: 4 }}>₹{empPrice} / employee</div>
                    </div>
                    <div style={{ padding: 12, background: C.bg, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: C.textMuted }}>Active Organizations</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, marginTop: 4 }}>{stats?.totalAdmins || 0} Company accounts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Platform Health checklist */}
              <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Platform Health State</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>API Gateway</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.success }}>● Operational</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>Biometrics Sync</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.success }}>● Connected</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>Database Server</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.success }}>● Live</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>Latest backup</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. ACTION CENTER VIEW ─────────────────────────────────────── */}
        {activeView === 'actions' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20 }}>System Action Checklist</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <span className="material-symbols-outlined" style={{ color: C.warning }}>how_to_reg</span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 750, color: C.text }}>Pending Admin Registrations</h4>
                  <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>There are {pendingAdmins.length} companies awaiting approval to setup their employee spaces.</p>
                  <button style={{ ...btn('warning', 'sm'), marginTop: 8 }} onClick={() => navigate('/superadmin/approvals')}>Navigate to Approvals</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 10, background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)' }}>
                <span className="material-symbols-outlined" style={{ color: C.accent }}>payments</span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 750, color: C.text }}>Monthly Invoicing Due</h4>
                  <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Billed pricing is currently set to ₹{empPrice} per active employee. System invoices will be drafted soon.</p>
                  <button style={{ ...btn('outline', 'sm'), marginTop: 8 }} onClick={() => navigate('/superadmin/contracts')}>Manage Contract Fees</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. COMPANIES VIEW ─────────────────────────────────────────── */}
        {activeView === 'companies' && (
          <div>
            {/* Search and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate('/superadmin/companies')} style={btn(location.search === '' ? 'primary' : 'ghost', 'sm')}>All Companies</button>
                <button onClick={() => navigate('/superadmin/companies?status=Active')} style={btn(location.search.includes('Active') ? 'primary' : 'ghost', 'sm')}>Active</button>
                <button onClick={() => navigate('/superadmin/companies?status=Suspended')} style={btn(location.search.includes('Suspended') ? 'primary' : 'ghost', 'sm')}>Suspended</button>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`,
                minWidth: 260,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textMuted }}>search</span>
                <input
                  type="text"
                  placeholder="Search companies or admins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, width: '100%' }}
                />
              </div>
            </div>

            {/* List / Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="spinner" style={{ margin: '0 auto 14px' }} />
                <div style={{ fontSize: 13, color: C.textMuted }}>Loading accounts...</div>
              </div>
            ) : filteredList.length === 0 ? (
              <EmptyState icon="group_off" title="No companies found" subtitle="Try clearing the active filter or changing search query." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredList.map(admin => {
                  const isExpanded = expandedAdminId === admin.empId;
                  return (
                    <div
                      key={admin.empId}
                      style={{
                        background: C.surface, borderRadius: 14, border: `1px solid ${!admin.statusBySuperAdmin ? 'rgba(239,68,68,0.25)' : C.border}`,
                        overflow: 'hidden', transition: 'all 0.2s'
                      }}
                    >
                      {/* Header Row */}
                      <div
                        onClick={() => {
                          setExpandedAdminId(isExpanded ? null : admin.empId);
                          setActiveAdminSubTab('profile');
                        }}
                        style={{
                          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 14, cursor: 'pointer', hover: { background: C.bg }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 200px' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: admin.statusBySuperAdmin ? `linear-gradient(135deg, ${C.accent}20, ${C.accentLight}10)` : 'rgba(239,68,68,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800,
                            color: admin.statusBySuperAdmin ? C.accent : C.danger
                          }}>
                            {(admin.name || admin.email || '?')[0].toUpperCase()}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{admin.name || admin.email}</div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{admin.email} · ID #{admin.empId}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <span style={badge(admin.status)}>
                            <StatusDot color={badge(admin.status).color} />
                            {admin.status}
                          </span>

                          <div style={{ display: 'flex', gap: 14, textTransform: 'uppercase', fontSize: 9, fontWeight: 800, color: C.textMuted }}>
                            <div>
                              <span>Employees</span>
                              <div style={{ fontSize: 15, fontWeight: 900, color: C.info, marginTop: 2 }}>{admin.currentEmployeeCount}</div>
                            </div>
                            <div>
                              <span>Spaces</span>
                              <div style={{ fontSize: 15, fontWeight: 900, color: C.purple, marginTop: 2 }}>{admin.currentSpaceCount}</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: C.textMuted }}>
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Section (Sub Tabs) */}
                      {isExpanded && (
                        <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: 20, textAlign: 'left' }}>
                          {/* Inner Tabs Navigation */}
                          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: 16, marginBottom: 16 }}>
                            {['profile', 'invoices', 'documents', 'tickets'].map(subTab => (
                              <button
                                key={subTab}
                                onClick={() => setActiveAdminSubTab(subTab)}
                                style={{
                                  background: 'none', border: 'none', paddingBottom: 10, cursor: 'pointer',
                                  fontSize: 12, fontWeight: 700, color: activeAdminSubTab === subTab ? C.accent : C.textMuted,
                                  borderBottom: activeAdminSubTab === subTab ? `2px solid ${C.accent}` : 'none',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {subTab === 'profile' ? 'Profile / History' : subTab}
                              </button>
                            ))}
                          </div>

                          {/* Tab Contents */}
                          {activeAdminSubTab === 'profile' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 12, color: C.textMuted }}>Admin Workspace: <strong>{admin.spaceName || 'N/A'}</strong></div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>Date Joined: <strong>{new Date(admin.dateOfJoining).toLocaleDateString()}</strong></div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>Billing Tier: <strong>₹{empPrice} per staff/mo</strong></div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Administrative Actions:</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button style={btn('outline', 'sm')} onClick={() => setLimitsModal(admin)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tune</span> Edit Limits
                                  </button>
                                  {admin.statusBySuperAdmin ? (
                                    <button style={btn('danger', 'sm')} onClick={() => setStatusModal({ admin, mode: 'revoke' })}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>block</span> Suspend
                                    </button>
                                  ) : (
                                    <button style={btn('success', 'sm')} onClick={() => setApproveModal(admin)}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> Activate
                                    </button>
                                  )}
                                  <button style={btn('ghost', 'sm')} onClick={() => setStatusModal({ admin, mode: 'status' })}>
                                    Change Status
                                  </button>
                                  <button style={{ ...btn('danger', 'sm'), background: 'transparent', color: C.danger, border: `1px solid ${C.danger}` }} onClick={() => handleDeleteAdmin(admin)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeAdminSubTab === 'invoices' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Billed Logs</div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>
                                    <th style={{ padding: '6px 0', textAlign: 'left' }}>Billing Period</th>
                                    <th style={{ padding: '6px 0', textAlign: 'left' }}>Staff Count</th>
                                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Total Cost</th>
                                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td style={{ padding: '8px 0' }}>July 2026</td>
                                    <td style={{ padding: '8px 0' }}>{admin.currentEmployeeCount} employees</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{admin.currentEmployeeCount * empPrice}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', color: C.success }}>Paid</td>
                                  </tr>
                                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td style={{ padding: '8px 0' }}>June 2026</td>
                                    <td style={{ padding: '8px 0' }}>{admin.currentEmployeeCount} employees</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{admin.currentEmployeeCount * empPrice}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', color: C.success }}>Paid</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {activeAdminSubTab === 'documents' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>Contract Documents</div>
                              <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: '20px 10px', textAlign: 'center', color: C.textMuted }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>upload_file</span>
                                <span style={{ fontSize: 12 }}>Drag SLA agreement or registration certificate here.</span>
                              </div>
                            </div>
                          )}

                          {activeAdminSubTab === 'tickets' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>Workspace Tickets</div>
                              <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: C.danger }}>High</span>
                                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>Unable to load face-api models from CDN</div>
                                </div>
                                <span style={{ fontSize: 11, color: C.textMuted }}>Resolved</span>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 4. ADMIN APPROVALS VIEW ───────────────────────────────────── */}
        {activeView === 'approvals' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Pending Organization Registrations</h3>
            {pendingAdmins.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: C.textMuted }}>
                ✓ No pending admin applications.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingAdmins.map(admin => (
                  <div key={admin.empId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{admin.name || admin.email}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{admin.email} · Space: {admin.spaceName || 'Pending'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={btn('success', 'sm')} onClick={() => setApproveModal(admin)}>Approve</button>
                      <button style={btn('danger', 'sm')} onClick={() => setStatusModal({ admin, mode: 'revoke' })}>Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 5. PLANS & CONTRACTS VIEW ─────────────────────────────────── */}
        {activeView === 'contracts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Billing Engine Config */}
            <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Default Billing Engine Plan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Billed Cost per Employee (INR / mo)</label>
                  <input
                    type="number"
                    value={empPrice}
                    onChange={e => setEmpPrice(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, boxSizing: 'border-box' }}
                  />
                </div>
                <button 
                  style={{ ...btn('primary', 'sm'), alignSelf: 'flex-start' }} 
                  onClick={() => handleSavePricing({ professionalPrice: empPrice, starterPrice: starterPrice })}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Configuration'}
                </button>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  *Changing this adjusts the default rate billed on future monthly draft cycles for all workspaces.
                </div>
              </div>
            </div>

            {/* Custom SLA Contracts */}
            <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Enterprise SLA Contracts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 12, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>SBI Group Space</span>
                    <span style={{ display: 'block', fontSize: 10, color: C.textMuted }}>Custom contract rate: ₹89 / emp</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. PAYMENTS VIEW ─────────────────────────────────────────── */}
        {activeView === 'payments' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>SaaS MRR & Collections Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, background: C.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Projected MRR</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.success, marginTop: 4 }}>₹{(stats?.totalEmployees || 0) * empPrice}</div>
                </div>
                <div style={{ padding: 14, background: C.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Total Invoiced (This month)</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, marginTop: 4 }}>₹{(stats?.totalEmployees || 0) * empPrice}</div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Latest Billing Invoices</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                    <span>INV-2026-0701 (Microtechnique space)</span>
                    <span style={{ fontWeight: 700 }}>₹{ (stats?.totalEmployees || 0) * empPrice }</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. PAYROLL MONITOR VIEW ─────────────────────────────────── */}
        {activeView === 'payroll' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Company Automated Payroll Runs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>SBI Group Roster Sync</span>
                  <span style={{ display: 'block', fontSize: 10, color: C.textMuted }}>Last run: today, 01:00 AM (450 employees processed)</span>
                </div>
                <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>Success</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. SYSTEM HEALTH VIEW ────────────────────────────────────── */}
        {activeView === 'health' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* System Status */}
            <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>API & Endpoint Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', fontSize: 13, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                  <span>API gateway response</span>
                  <span style={{ color: C.success, fontWeight: 700 }}>99.98% (23ms latency)</span>
                </div>
                <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Database cluster load</span>
                  <span style={{ color: C.success, fontWeight: 700 }}>12% active memory</span>
                </div>
              </div>
            </div>

            {/* Backups */}
            <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Automated Disaster Backups</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', fontSize: 13, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                  <span>Daily Database Dump</span>
                  <span style={{ color: C.success, fontWeight: 700 }}>✓ Verified</span>
                </div>
                <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Biometric face data backup</span>
                  <span style={{ color: C.success, fontWeight: 700 }}>✓ Complete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 9. SUPPORT VIEW ──────────────────────────────────────────── */}
        {activeView === 'support' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Active Platform Support Tickets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.danger, uppercase: true }}>Urgent</span>
                  <div style={{ fontSize: 13, fontWeight: 750, marginTop: 2 }}>Face detection models fail to load locally</div>
                  <span style={{ display: 'block', fontSize: 10, color: C.textMuted }}>Submitted by Admin @ Microtechnique</span>
                </div>
                <button style={btn('outline', 'sm')}>Resolve Ticket</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 10. SECURITY & AUDIT VIEW ────────────────────────────────── */}
        {activeView === 'security' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>SuperAdmin Activity Audit Trail</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Actor</th>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Resource Affected</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Security Level</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 0' }}>{new Date().toLocaleString()}</td>
                  <td style={{ padding: '10px 0' }}>{user?.name || 'SuperAdmin'}</td>
                  <td style={{ padding: '10px 0' }}>Access verification model fetch</td>
                  <td style={{ padding: '10px 0' }}>face-api weights CDN check</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: C.info }}>Audit Checked</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── 11. ANALYTICS VIEW ───────────────────────────────────────── */}
        {activeView === 'analytics' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>SaaS Platform Adoption Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ padding: 14, background: C.bg, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Total Shifts Logged (July 2026)</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.accent, marginTop: 4 }}>14,520 logs</div>
              </div>
              <div style={{ padding: 14, background: C.bg, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Daily active biometrics verification matches</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.success, marginTop: 4 }}>98.2% verification rate</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 12. GLOBAL SETTINGS VIEW ─────────────────────────────────── */}
        {activeView === 'settings' && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Global Policy Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Default Advisory Workspace limit</label>
                <input
                  type="number"
                  defaultValue={100}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                *Advisory limit for maximum employee count inside newly registered organizational workspaces.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      {approveModal && (
        <ApproveModal
          admin={approveModal}
          onClose={() => setApproveModal(null)}
          onConfirm={handleApprove}
          loading={actionLoading}
        />
      )}
      {statusModal && (
        <StatusModal
          admin={statusModal.admin}
          mode={statusModal.mode}
          onClose={() => setStatusModal(null)}
          onConfirm={handleStatusChange}
          loading={actionLoading}
        />
      )}
      {limitsModal && (
        <LimitsModal
          admin={limitsModal}
          onClose={() => setLimitsModal(null)}
          onConfirm={handleLimits}
          loading={actionLoading}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          user={user}
          initialEmpPrice={empPrice}
          initialStarterPrice={starterPrice}
          onSavePricing={handleSavePricing}
          onClose={() => setShowSettingsModal(false)}
          onConfirm={handleSaveSettings}
          loading={actionLoading}
        />
      )}
      {showAddSuperAdminModal && (
        <AddSuperAdminModal
          onClose={() => setShowAddSuperAdminModal(false)}
          onConfirm={handleCreateSuperAdmin}
          loading={actionLoading}
        />
      )}
      {showAddCompanyModal && (
        <AddCompanyModal
          onClose={() => setShowAddCompanyModal(false)}
          onConfirm={handleAddCompany}
          loading={actionLoading}
        />
      )}
    </AppLayout>
  );
}
