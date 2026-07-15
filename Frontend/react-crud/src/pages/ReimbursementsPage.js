import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { reimbursementApi, spacesApi } from '../api/index';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function ReimbursementsPage({ isAdmin }) {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form State
  const [type, setType] = useState('Travel');
  const [customType, setCustomType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchClaims();
    if (isAdmin && user?.userId) {
      spacesApi.getAllEmployeesByAdmin(user.userId).then(res => {
        setEmployees(res.data || []);
      }).catch(err => console.error(err));
    }
  }, [isAdmin, user?.userId]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await reimbursementApi.getAllClaims() : await reimbursementApi.getMyClaims();
      setClaims(res.data || []);
    } catch (err) {
      toast.error('Failed to load claims');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reimbursementApi.applyClaim({
        empId: selectedEmpId ? parseInt(selectedEmpId) : 0,
        type: type === 'Other' ? customType : type,
        amount: parseFloat(amount),
        description,
        receiptUrl
      });
      toast.success('Claim submitted successfully');
      setShowApplyModal(false);
      setAmount('');
      setDescription('');
      setReceiptUrl('');
      setSelectedEmpId('');
      setSelectedEmpName('');
      setCustomType('');
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await reimbursementApi.updateStatus(id, status);
      toast.success(`Claim ${status.toLowerCase()}`);
      fetchClaims();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="badge badge-success">Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger">Rejected</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <AppLayout role={isAdmin ? 'admin' : 'employee'}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
              {isAdmin ? 'Team Reimbursements' : 'My Reimbursement Claims'}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>
              Manage expense claims and allowances
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Claim
          </button>
        </div>

        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {isAdmin && <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Employee</th>}
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Receipt</th>
                {isAdmin && <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Loading claims...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No claims found.</td></tr>
              ) : (
                claims.map(c => (
                  <tr key={c.claimId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    {isAdmin && (
                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>
                        {c.employeeName || 'Unknown'}
                      </td>
                    )}
                    <td style={{ padding: '16px', fontSize: 14 }}>
                      <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{c.type}</div>
                      {c.description && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                      ₹{c.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--gray-500)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(c.status)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {c.receiptUrl ? (
                        <a href={c.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)', fontSize: 13, textDecoration: 'none' }}>View Receipt</a>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {c.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ padding: '6px 12px', background: '#D1FAE5', color: '#059669', fontSize: 12, border: 'none' }} onClick={() => handleUpdateStatus(c.claimId, 'Approved')}>Approve</button>
                            <button className="btn" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', fontSize: 12, border: 'none' }} onClick={() => handleUpdateStatus(c.claimId, 'Rejected')}>Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showApplyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>Submit Claim</h2>
              <button className="btn-icon" onClick={() => setShowApplyModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                {isAdmin && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Employee</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      list="emp-list" 
                      value={selectedEmpName} 
                      onChange={e => {
                        setSelectedEmpName(e.target.value);
                        const emp = employees.find(emp => emp.name === e.target.value);
                        setSelectedEmpId(emp ? emp.userId : '');
                      }} 
                      required 
                      placeholder="Type employee name..."
                    />
                    <datalist id="emp-list">
                      {employees.map(e => (
                        <option key={e.userId} value={e.name} />
                      ))}
                    </datalist>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Expense Type</label>
                  <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                    <option>Travel</option>
                    <option>Food & Dining</option>
                    <option>Internet / Phone</option>
                    <option>Medical</option>
                    <option>Office Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                  {type === 'Other' && (
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ marginTop: 8 }} 
                      value={customType} 
                      onChange={e => setCustomType(e.target.value)} 
                      placeholder="Specify expense type..." 
                      required 
                    />
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} min="1" step="0.01" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="Explain the expense..."></textarea>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Receipt URL (Optional)</label>
                  <input type="url" className="form-input" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
