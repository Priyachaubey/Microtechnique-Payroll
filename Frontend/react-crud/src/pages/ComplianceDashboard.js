import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../api/index';
import AppLayout from '../components/AppLayout';

export default function ComplianceDashboard() {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PF',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    dueDate: '',
    status: 'Pending',
    challanNumber: '',
    filedDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchFilings();
  }, []);

  const fetchFilings = () => {
    setLoading(true);
    complianceApi.getFilings()
      .then(res => setFilings(res.data || []))
      .catch(err => {
        console.error(err);
        toast.error("Failed to load compliance filings");
      })
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (filing = null) => {
    if (filing) {
      setEditingId(filing.filingId);
      setFormData({
        type: filing.type,
        month: filing.month,
        year: filing.year,
        amount: filing.amount,
        dueDate: filing.dueDate ? filing.dueDate.split('T')[0] : '',
        status: filing.status,
        challanNumber: filing.challanNumber || '',
        filedDate: filing.filedDate ? filing.filedDate.split('T')[0] : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'PF',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
        dueDate: '',
        status: 'Pending',
        challanNumber: '',
        filedDate: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };
    
    // convert empty strings to null for dates
    if (!payload.filedDate) payload.filedDate = null;
    if (!payload.dueDate) payload.dueDate = new Date().toISOString();

    if (editingId) {
      complianceApi.updateFiling(editingId, payload)
        .then(() => {
          toast.success("Filing updated");
          setShowModal(false);
          fetchFilings();
        })
        .catch(err => toast.error("Failed to update"));
    } else {
      complianceApi.addFiling(payload)
        .then(() => {
          toast.success("Filing added");
          setShowModal(false);
          fetchFilings();
        })
        .catch(err => toast.error("Failed to add"));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      complianceApi.deleteFiling(id)
        .then(() => {
          toast.success("Filing deleted");
          fetchFilings();
        })
        .catch(err => toast.error("Failed to delete"));
    }
  };

  const [filterType, setFilterType] = useState('All');

  // Stats for the pie charts
  const pfFilings = filings.filter(f => f.type === 'PF');
  const pfPaidCount = pfFilings.filter(f => f.status === 'Paid').length;
  const pfPendingCount = pfFilings.filter(f => f.status === 'Pending').length;
  const pfTotalCount = pfFilings.length || 1; // avoid / 0
  const pfPaidPercent = Math.round((pfPaidCount / pfTotalCount) * 100);
  const pfPendingPercent = Math.round((pfPendingCount / pfTotalCount) * 100);

  const esiFilings = filings.filter(f => f.type === 'ESI');
  const esiPaidCount = esiFilings.filter(f => f.status === 'Paid').length;
  const esiPendingCount = esiFilings.filter(f => f.status === 'Pending').length;
  const esiTotalCount = esiFilings.length || 1;
  const esiPaidPercent = Math.round((esiPaidCount / esiTotalCount) * 100);
  const esiPendingPercent = Math.round((esiPendingCount / esiTotalCount) * 100);

  const ptFilings = filings.filter(f => f.type === 'PT');
  const ptPaidCount = ptFilings.filter(f => f.status === 'Paid').length;
  const ptPendingCount = ptFilings.filter(f => f.status === 'Pending').length;
  const ptTotalCount = ptFilings.length || 1;
  const ptPaidPercent = Math.round((ptPaidCount / ptTotalCount) * 100);
  const ptPendingPercent = Math.round((ptPendingCount / ptTotalCount) * 100);

  const tdsFilings = filings.filter(f => f.type === 'TDS');
  const tdsPaidCount = tdsFilings.filter(f => f.status === 'Paid').length;
  const tdsPendingCount = tdsFilings.filter(f => f.status === 'Pending').length;
  const tdsTotalCount = tdsFilings.length || 1;
  const tdsPaidPercent = Math.round((tdsPaidCount / tdsTotalCount) * 100);
  const tdsPendingPercent = Math.round((tdsPendingCount / tdsTotalCount) * 100);

  const pendingColor = '#fbbf24'; // amber-400 for pending segments

  const toggleFilter = (type) => {
    if (filterType === type) setFilterType('All');
    else setFilterType(type);
  };

  const filteredFilings = filterType === 'All' ? filings : filings.filter(f => f.type === filterType);

  return (
    <AppLayout role="admin">
      <div className="page-content fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Compliance Dashboard</h1>
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Track statutory filings and challans.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add Filing / Challan
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {/* PF Chart */}
          <div className="card hover-lift" 
               style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: filterType === 'PF' ? '2px solid var(--success)' : '1px solid transparent' }}
               onClick={() => toggleFilter('PF')}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(var(--success) 0% ${pfPaidPercent}%, ${pendingColor} ${pfPaidPercent}% ${pfPaidPercent + pfPendingPercent}%, var(--gray-200) ${pfPaidPercent + pfPendingPercent}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{pfPaidPercent}%</span>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>PF</h3>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{pfPaidCount} of {pfTotalCount === 1 && pfFilings.length === 0 ? 0 : pfTotalCount} paid</p>
            </div>
          </div>

          {/* ESI Chart */}
          <div className="card hover-lift" 
               style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: filterType === 'ESI' ? '2px solid var(--primary-600)' : '1px solid transparent' }}
               onClick={() => toggleFilter('ESI')}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(var(--primary-600) 0% ${esiPaidPercent}%, ${pendingColor} ${esiPaidPercent}% ${esiPaidPercent + esiPendingPercent}%, var(--gray-200) ${esiPaidPercent + esiPendingPercent}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{esiPaidPercent}%</span>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>ESI</h3>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{esiPaidCount} of {esiTotalCount === 1 && esiFilings.length === 0 ? 0 : esiTotalCount} paid</p>
            </div>
          </div>

          {/* PT Chart */}
          <div className="card hover-lift" 
               style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: filterType === 'PT' ? '2px solid #8b5cf6' : '1px solid transparent' }}
               onClick={() => toggleFilter('PT')}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(#8b5cf6 0% ${ptPaidPercent}%, ${pendingColor} ${ptPaidPercent}% ${ptPaidPercent + ptPendingPercent}%, var(--gray-200) ${ptPaidPercent + ptPendingPercent}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{ptPaidPercent}%</span>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>PT</h3>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{ptPaidCount} of {ptTotalCount === 1 && ptFilings.length === 0 ? 0 : ptTotalCount} paid</p>
            </div>
          </div>

          {/* TDS Chart */}
          <div className="card hover-lift" 
               style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: filterType === 'TDS' ? '2px solid #f59e0b' : '1px solid transparent' }}
               onClick={() => toggleFilter('TDS')}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(#f59e0b 0% ${tdsPaidPercent}%, ${pendingColor} ${tdsPaidPercent}% ${tdsPaidPercent + tdsPendingPercent}%, var(--gray-200) ${tdsPaidPercent + tdsPendingPercent}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{tdsPaidPercent}%</span>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>TDS</h3>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{tdsPaidCount} of {tdsTotalCount === 1 && tdsFilings.length === 0 ? 0 : tdsTotalCount} paid</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Challan No</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
              ) : filteredFilings.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No filings found</td></tr>
              ) : filteredFilings.map(f => (
                <tr key={f.filingId}>
                  <td style={{ fontWeight: 600 }}>{f.type}</td>
                  <td>{f.month}/{f.year}</td>
                  <td style={{ fontWeight: 600 }}>₹{f.amount}</td>
                  <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${f.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>{f.challanNumber || '-'}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleOpenModal(f)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(f.filingId)} style={{ color: 'var(--danger)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal" style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Filing' : 'Add Filing'}</h2>
                <button className="btn-icon" onClick={() => setShowModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Type</label>
                    <select 
                      className="input-field" 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="PF">PF</option>
                      <option value="ESI">ESI</option>
                      <option value="PT">PT</option>
                      <option value="TDS">TDS</option>
                    </select>
                  </div>

                  <div className="grid grid-2" style={{ marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Month (1-12)</label>
                      <input type="number" className="input-field" required min="1" max="12" value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="form-label">Year</label>
                      <input type="number" className="input-field" required min="2020" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Due Date</label>
                    <input type="date" className="input-field" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Status</label>
                    <select 
                      className="input-field" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  {formData.status === 'Paid' && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Challan Number</label>
                        <input type="text" className="input-field" required value={formData.challanNumber} onChange={e => setFormData({...formData, challanNumber: e.target.value})} />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Filed Date</label>
                        <input type="date" className="input-field" required value={formData.filedDate} onChange={e => setFormData({...formData, filedDate: e.target.value})} />
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Filing</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
