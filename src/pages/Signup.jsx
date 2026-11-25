import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../data/departmentsData';

export default function Signup() {
  const { signup, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    department: DEPARTMENTS[0].name,
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && role) {
      const dest =
        role === 'admin' ? '/admin-dashboard' : role === 'instructor' ? '/instructor-dashboard' : '/student-dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: 'var(--accent-rose)' };
    if (pwd.length < 10) return { score: 2, label: 'Medium', color: 'var(--accent-amber)' };
    return { score: 3, label: 'Strong', color: 'var(--accent-emerald)' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('A valid email address is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = signup(formData);
    if (res.success) {
      const dest = res.user.role === 'instructor' ? '/instructor-dashboard' : '/student-dashboard';
      navigate(dest, { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              color: 'var(--btn-primary-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <Building2 size={24} />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Create University Account</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Register for courses, campus labs, faculty grading, and verifiable certificates.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '11px 14px',
              background: 'rgba(190, 18, 60, 0.09)',
              border: '1px solid rgba(190, 18, 60, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="signup-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="signup-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="name@klu.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="signup-role" className="form-label">Academic Role</label>
              <select
                id="signup-role"
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student Scholar</option>
                <option value="instructor">Faculty Instructor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="signup-dept" className="form-label">Department</label>
              <select
                id="signup-dept"
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="signup-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            {formData.password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(strength.score / 3) * 100}%`, height: '100%', background: strength.color, transition: 'width 0.25s ease' }} />
                </div>
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="signup-confirm"
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>
            Create Account &amp; Enter Portal <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
