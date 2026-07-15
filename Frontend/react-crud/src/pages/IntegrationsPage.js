import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function IntegrationsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleExportTally = async () => {
    try {
      const res = await apiClient.get('/Integrations/export/tally', {
        params: { month, year },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tally_Export_${month}_${year}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tally XML downloaded');
    } catch (err) {
      toast.error('Failed to export for Tally');
    }
  };

  const handleExportZoho = async () => {
    try {
      const res = await apiClient.get('/Integrations/export/zoho', {
        params: { month, year },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zoho_Export_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Zoho CSV downloaded');
    } catch (err) {
      toast.error('Failed to export for Zoho');
    }
  };

  return (
    <AppLayout role="admin">
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--gray-900)' }}>Seamless Integrations</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--gray-500)' }}>Export payroll data to your favorite accounting software.</p>

        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Select Period</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <select className="form-control" value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ width: 150 }}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-control" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 150 }}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Tally Integration */}
          <div style={{ flex: 1, background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>account_balance_wallet</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Tally Prime</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--gray-500)' }}>Export Journal Vouchers in XML format for direct import into Tally.</p>
            <button className="btn btn-primary" onClick={handleExportTally} style={{ width: '100%', background: '#D97706', borderColor: '#D97706' }}>Export Tally XML</button>
          </div>

          {/* Zoho Integration */}
          <div style={{ flex: 1, background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>cloud_sync</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Zoho Books</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--gray-500)' }}>Export payroll expenses in CSV format for Zoho Books accounting.</p>
            <button className="btn btn-primary" onClick={handleExportZoho} style={{ width: '100%', background: '#2563EB', borderColor: '#2563EB' }}>Export Zoho CSV</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
