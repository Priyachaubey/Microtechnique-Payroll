import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { assetApi, usersApi } from '../api/index';
import toast from 'react-hot-toast';

export default function AssetsPage({ isAdmin }) {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('Laptop');
  const [customType, setCustomType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assignedEmpId, setAssignedEmpId] = useState('');
  const [assignedDate, setAssignedDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const assetRes = isAdmin ? await assetApi.getAssets() : await assetApi.getMyAssets();
      setAssets(assetRes.data || []);
      
      if (isAdmin) {
        const empRes = await usersApi.getCompanyUsers();
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    const finalType = type === 'Other' && customType ? customType : type;
    try {
      await assetApi.createAsset({
        name,
        type: finalType,
        serialNumber,
        assignedEmpId: assignedEmpId ? parseInt(assignedEmpId) : null,
        assignedDate: assignedEmpId && assignedDate ? new Date(assignedDate).toISOString() : null
      });
      toast.success('Asset added');
      setShowAddModal(false);
      setName('');
      setType('Laptop');
      setCustomType('');
      setSerialNumber('');
      setAssignedEmpId('');
      setAssignedDate('');
      fetchData();
    } catch (err) {
      toast.error('Failed to add asset');
    }
  };

  const handleAssign = async (assetId, newEmpId) => {
    try {
      await assetApi.assignAsset(assetId, newEmpId ? parseInt(newEmpId) : null);
      toast.success('Asset assignment updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to assign asset');
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetApi.deleteAsset(assetId);
      toast.success('Asset deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  return (
    <AppLayout role={isAdmin ? 'admin' : 'employee'}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
              {isAdmin ? 'Asset Management' : 'My Assigned Assets'}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>
              Track hardware and software inventory
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add Asset
            </button>
          )}
        </div>

        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Asset Name</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Serial No.</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Status</th>
                {isAdmin && <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Assigned To</th>}
                {isAdmin && <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No assets found.</td></tr>
              ) : (
                assets.map(a => (
                  <tr key={a.assetId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{a.name}</td>
                    <td style={{ padding: '16px', fontSize: 14, color: 'var(--gray-600)' }}>{a.type}</td>
                    <td style={{ padding: '16px', fontSize: 14, color: 'var(--gray-600)', fontFamily: 'monospace' }}>{a.serialNumber || '—'}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${a.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '16px' }}>
                        <select 
                          className="form-control" 
                          style={{ padding: '4px 8px', fontSize: 13, height: 'auto' }}
                          value={a.assignedEmpId || ''}
                          onChange={(e) => handleAssign(a.assetId, e.target.value)}
                        >
                          <option value="">-- Unassigned --</option>
                          {employees.map(e => <option key={e.empId} value={e.empId}>{e.name}</option>)}
                        </select>
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteAsset(a.assetId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger-color, #DC2626)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>Add New Asset</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddAsset}>
              <div className="modal-body">
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Asset Name / Model</label>
                  <input required className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MacBook Pro M2" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                    <option>Laptop</option>
                    <option>Monitor</option>
                    <option>Mobile Phone</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>
                </div>
                {type === 'Other' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Specify Custom Type</label>
                    <input required className="form-input" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g. Server, Projector" />
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Serial Number</label>
                  <input className="form-input" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Assign to Employee (Optional)</label>
                  <select className="form-input" value={assignedEmpId} onChange={e => setAssignedEmpId(e.target.value)}>
                    <option value="">-- Leave Unassigned --</option>
                    {employees.map(e => <option key={e.empId} value={e.empId}>{e.name}</option>)}
                  </select>
                </div>
                {assignedEmpId && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Date Assigned</label>
                    <input type="date" required className="form-input" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
