import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../api/index';
import AppLayout from '../components/AppLayout';

export default function ComplianceSettings() {
  const [settings, setSettings] = useState({
    pfPercentage: 12.0,
    esiPercentage: 0.75,
    ptAmount: 200.0,
    tdsPercentage: 10.0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    setLoading(true);
    complianceApi.getSettings()
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => {
        console.error("Failed to load settings", err);
        toast.error("Failed to load compliance settings.");
      })
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    complianceApi.updateSettings(settings)
      .then(() => {
        toast.success("Settings saved successfully.");
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to save settings.");
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  return (
    <AppLayout role="admin">
      <div className="page-content fade-in">
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Compliance Settings</h1>
        
        {loading ? <p>Loading...</p> : (
          <div className="card" style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Provident Fund (PF) %</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                name="pfPercentage"
                value={settings.pfPercentage} 
                onChange={handleChange}
              />
              <small style={{ color: 'var(--gray-500)' }}>Default is 12% of Basic Salary.</small>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ESI %</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                name="esiPercentage"
                value={settings.esiPercentage} 
                onChange={handleChange}
              />
              <small style={{ color: 'var(--gray-500)' }}>Default is 0.75% of Basic Salary.</small>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Professional Tax (PT) ₹</label>
              <input 
                type="number" 
                step="1"
                className="form-input" 
                name="ptAmount"
                value={settings.ptAmount} 
                onChange={handleChange}
              />
              <small style={{ color: 'var(--gray-500)' }}>Fixed amount per month (e.g. 200).</small>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Default TDS %</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                name="tdsPercentage"
                value={settings.tdsPercentage} 
                onChange={handleChange}
              />
              <small style={{ color: 'var(--gray-500)' }}>Flat TDS rate applied for basic estimation.</small>
            </div>

            <button className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
