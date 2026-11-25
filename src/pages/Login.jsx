import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, GraduationCap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginAs, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getDashboardPath = (r) =>
    r === 'admin' ? '/admin-dashboard' : r === 'instructor' ? '/instructor-dashboard' : '/student-dashboard';

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(getDashboardPath(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const resolveDestination = (userRole) => {
    const requested = location.state?.from?.pathname;
    if (requested && !['/login', '/signup'].includes(requested)) {
      if (requested.startsWith('/admin-dashboard') && userRole !== 'admin') return getDashboardPath(userRole);
      if (requested.startsWith('/instructor-dashboard') && !['instructor', 'admin'].includes(userRole)) {
        return getDashboardPath(userRole);
      }
      if (
        ['/student-dashboard', '/my-courses', '/assignments', '/progress', '/certificates'].some((p) =>
          requested.startsWith(p)
        ) &&
        userRole !== 'student'
      ) {
        return getDashboardPath(userRole);
      }
      return requested + (location.state?.from?.search || '');
    }
    return getDashboardPath(userRole);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your university email and password.');
      return;
    }

    setLoading(true);
    const res = login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(resolveDestination(res.user.role), { replace: true });
    } else {
      setError(res.message);
    }
  };

  const handleQuickDemo = (demoRole) => {
    setError('');
    const res = loginAs(demoRole);
    if (res.success) {
      navigate(resolveDestination(res.user.role), { replace: true });
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
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

          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>University Portal Sign In</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Access KL University courses, dashboards, grading tools, and credentials.
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Standard Email & Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="login-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="student@learnsphere.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                id="login-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>
            {loading ? 'Signing in...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials Section (Inside Auth Screen Only) */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              fontSize: '0.73rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              textAlign: 'center',
              marginBottom: '10px'
            }}
          >
            Demo Accounts (Password: password123)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('student')}
              className="btn btn-outline btn-sm"
              title="student@learnsphere.edu / password123"
              style={{ flexDirection: 'column', gap: '4px', padding: '9px 6px' }}
            >
              <GraduationCap size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '0.76rem' }}>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('instructor')}
              className="btn btn-outline btn-sm"
              title="instructor@learnsphere.edu / password123"
              style={{ flexDirection: 'column', gap: '4px', padding: '9px 6px' }}
            >
              <ShieldCheck size={15} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ fontSize: '0.76rem' }}>Instructor</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="btn btn-outline btn-sm"
              title="admin@learnsphere.edu / password123"
              style={{ flexDirection: 'column', gap: '4px', padding: '9px 6px' }}
            >
              <Shield size={15} style={{ color: 'var(--accent-bronze)' }} />
              <span style={{ fontSize: '0.76rem' }}>Admin</span>
            </button>
          </div>
        </div>

        {/* Registration Link */}
        <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '22px' }}>
          New to KL University LearnSphere?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
