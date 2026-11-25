import React, { useState } from 'react';
import { User, Mail, Building2, Save, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../data/departmentsData';
import { generateAvatar } from '../utils/storage';

export default function Profile() {
  const { user, updateProfile, role } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    department: user?.department || DEPARTMENTS[0].name
  });

  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    const nextAvatar = generateAvatar(formData.name, role);
    updateProfile({
      name: formData.name.trim(),
      headline: formData.headline.trim(),
      department: formData.department,
      avatar: nextAvatar
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Identity &amp; Preferences</span>
            <h1 className="welcome-title">Account Profile Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Manage your academic identity displayed across faculty rosters, coursework, and certificates.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={user?.avatar}
              alt={user?.name}
              style={{
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                border: '3px solid var(--accent-cyan)',
                marginBottom: '14px',
                objectFit: 'cover'
              }}
            />

            <span className="badge badge-bronze" style={{ marginBottom: '8px' }}>
              {role?.toUpperCase()} ACCOUNT
            </span>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>{user?.name}</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {user?.headline}
            </p>

            <div
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px'
              }}
            >
              <div>
                <strong>University ID:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{user?.studentId}</span>
              </div>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>Department:</strong> {user?.department}
              </div>
              <div>
                <strong>Joined:</strong> {user?.joinedDate}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.16rem', marginBottom: '18px' }}>Edit Academic Profile</h3>

            {savedToast && (
              <div
                role="status"
                style={{
                  padding: '10px 14px',
                  background: 'rgba(15, 118, 110, 0.1)',
                  border: '1px solid rgba(15, 118, 110, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-emerald)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px'
                }}
              >
                <CheckCircle2 size={16} /> Profile updated across university systems.
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="profile-name" className="form-label">Full Legal Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-headline" className="form-label">Academic Headline</label>
                <input
                  id="profile-headline"
                  type="text"
                  className="form-input"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. B.Tech CSE Honors Scholar"
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-dept" className="form-label">Primary Faculty / Department</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select
                    id="profile-dept"
                    className="form-select"
                    style={{ paddingLeft: '36px' }}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-email" className="form-label">University Email (Verified)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '36px', opacity: 0.65, cursor: 'not-allowed' }}
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <Save size={15} /> Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
