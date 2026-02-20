import React, { useState, useEffect } from 'react';
import { Save, Camera, Target, Bell, Info, Check, X } from 'lucide-react';
import axios from 'axios';

function Settings() {
  const [activeTab, setActiveTab] = useState('camera');
  const [settings, setSettings] = useState({
    camera: {},
    detection: {},
    alerts: {},
    system: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      setLoading(false);
    }
  };

  const handleInputChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Flatten settings for API
      const flatSettings = {
        // Camera
        camera_url: settings.camera.url,
        camera_username: settings.camera.username,
        camera_password: settings.camera.password,
        camera_location: settings.camera.location,
        
        // Detection
        confidence_threshold: settings.detection.confidence_threshold,
        cooldown_seconds: settings.detection.cooldown_seconds,
        enable_fall_detection: settings.detection.enable_fall_detection,
        enable_fighting_detection: settings.detection.enable_fighting_detection,
        
        // Alerts
        alert_email_enabled: settings.alerts.email_enabled,
        alert_email_address: settings.alerts.email_address,
        alert_sms_enabled: settings.alerts.sms_enabled,
        alert_phone_number: settings.alerts.phone_number,
        alert_sound_enabled: settings.alerts.sound_enabled,
        
        // System
        organization_name: settings.system.organization_name,
        contact_person: settings.system.contact_person,
        emergency_contact: settings.system.emergency_contact,
        system_location: settings.system.system_location,
      };

      const response = await axios.post('http://localhost:8000/settings/update', flatSettings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'detection', label: 'Detection', icon: Target },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'system', label: 'System', icon: Info },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Configure your fall detection system</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div style={{
          ...styles.alert,
          ...(message.type === 'success' ? styles.alertSuccess : styles.alertError)
        }}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div style={styles.content}>
        {/* Camera Settings */}
        {activeTab === 'camera' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Camera Configuration</h2>
            
            <div style={styles.field}>
              <label style={styles.label}>RTSP URL</label>
              <input
                type="text"
                value={settings.camera.url || ''}
                onChange={(e) => handleInputChange('camera', 'url', e.target.value)}
                placeholder="rtsp://username:password@192.168.1.100:554/stream1"
                style={styles.input}
              />
              <p style={styles.hint}>Full RTSP stream URL including credentials</p>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={settings.camera.username || ''}
                  onChange={(e) => handleInputChange('camera', 'username', e.target.value)}
                  placeholder="Camera username"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={settings.camera.password || ''}
                  onChange={(e) => handleInputChange('camera', 'password', e.target.value)}
                  placeholder="Camera password"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Camera Location</label>
              <input
                type="text"
                value={settings.camera.location || ''}
                onChange={(e) => handleInputChange('camera', 'location', e.target.value)}
                placeholder="e.g., Room 101, Main Entrance"
                style={styles.input}
              />
            </div>
          </div>
        )}

        {/* Detection Settings */}
        {activeTab === 'detection' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Detection Configuration</h2>
            
            <div style={styles.field}>
              <label style={styles.label}>
                Confidence Threshold: {(settings.detection.confidence_threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.detection.confidence_threshold || 0.75}
                onChange={(e) => handleInputChange('detection', 'confidence_threshold', parseFloat(e.target.value))}
                style={styles.slider}
              />
              <p style={styles.hint}>Higher values = fewer false alarms, but might miss some falls</p>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Cooldown Period (seconds)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.detection.cooldown_seconds || 30}
                onChange={(e) => handleInputChange('detection', 'cooldown_seconds', parseInt(e.target.value))}
                style={styles.input}
              />
              <p style={styles.hint}>Time between repeated alerts for the same incident</p>
            </div>

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.detection.enable_fall_detection || false}
                  onChange={(e) => handleInputChange('detection', 'enable_fall_detection', e.target.checked)}
                  style={styles.checkbox}
                />
                Enable Fall Detection
              </label>
            </div>

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.detection.enable_fighting_detection || false}
                  onChange={(e) => handleInputChange('detection', 'enable_fighting_detection', e.target.checked)}
                  style={styles.checkbox}
                />
                Enable Fighting Detection (Future Feature)
              </label>
            </div>
          </div>
        )}

        {/* Alert Settings */}
        {activeTab === 'alerts' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Alert Preferences</h2>
            
            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.alerts.email_enabled || false}
                  onChange={(e) => handleInputChange('alerts', 'email_enabled', e.target.checked)}
                  style={styles.checkbox}
                />
                Enable Email Notifications
              </label>
            </div>

            {settings.alerts.email_enabled && (
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={settings.alerts.email_address || ''}
                  onChange={(e) => handleInputChange('alerts', 'email_address', e.target.value)}
                  placeholder="admin@example.com"
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.alerts.sms_enabled || false}
                  onChange={(e) => handleInputChange('alerts', 'sms_enabled', e.target.checked)}
                  style={styles.checkbox}
                />
                Enable SMS Notifications
              </label>
            </div>

            {settings.alerts.sms_enabled && (
              <div style={styles.field}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={settings.alerts.phone_number || ''}
                  onChange={(e) => handleInputChange('alerts', 'phone_number', e.target.value)}
                  placeholder="+63-XXX-XXX-XXXX"
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.alerts.sound_enabled || false}
                  onChange={(e) => handleInputChange('alerts', 'sound_enabled', e.target.checked)}
                  style={styles.checkbox}
                />
                Enable Sound Alerts
              </label>
            </div>
          </div>
        )}

        {/* System Information */}
        {activeTab === 'system' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>System Information</h2>
            
            <div style={styles.field}>
              <label style={styles.label}>Organization Name</label>
              <input
                type="text"
                value={settings.system.organization_name || ''}
                onChange={(e) => handleInputChange('system', 'organization_name', e.target.value)}
                placeholder="e.g., CAIRE Healthcare"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contact Person</label>
              <input
                type="text"
                value={settings.system.contact_person || ''}
                onChange={(e) => handleInputChange('system', 'contact_person', e.target.value)}
                placeholder="Administrator name"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Emergency Contact</label>
              <input
                type="tel"
                value={settings.system.emergency_contact || ''}
                onChange={(e) => handleInputChange('system', 'emergency_contact', e.target.value)}
                placeholder="+63-XXX-XXX-XXXX"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>System Location</label>
              <input
                type="text"
                value={settings.system.system_location || ''}
                onChange={(e) => handleInputChange('system', 'system_location', e.target.value)}
                placeholder="e.g., Main Building, Floor 2"
                style={styles.input}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={styles.footer}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {})
          }}
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#7f8c8d',
    margin: 0,
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '15px',
    fontWeight: '500',
  },
  alertSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  alertError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#7f8c8d',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s',
  },
  tabActive: {
    color: '#3498db',
    borderBottomColor: '#3498db',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px',
  },
  section: {
    maxWidth: '700px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  field: {
    marginBottom: '25px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    fontFamily: 'inherit',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '13px',
    color: '#95a5a6',
    marginTop: '6px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    color: '#2c3e50',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 32px',
    backgroundColor: '#3498db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
  },
  saveButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Settings;