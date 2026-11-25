import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Compass, Mail, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isAuthenticated, role } = useAuth();
  const portalPath =
    role === 'admin'
      ? '/admin-dashboard'
      : role === 'instructor'
      ? '/instructor-dashboard'
      : '/student-dashboard';

  return (
    <footer
      style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '52px 0 28px',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}
        >
          {/* University Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--btn-primary-text)'
                }}
              >
                <Building2 size={17} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  LearnSphere
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-bronze)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  KL University (KLEF)
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
              Integrated digital university platform connecting courseware, faculty assessments, and credentials with the Vaddeswaram 3D campus twin.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} /> Green Fields, Vaddeswaram, AP 522302
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> academic-support@learnsphere.edu
              </span>
            </div>
          </div>

          {/* Academic Faculties */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', color: 'var(--text-primary)' }}>
              Campus Faculties
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <li>
                <Link to="/courses?department=computer-science">Computer Science &amp; Engineering (C Block)</Link>
              </li>
              <li>
                <Link to="/courses?department=artificial-intelligence">AI &amp; Knowledge Systems (SKC)</Link>
              </li>
              <li>
                <Link to="/courses?department=business">Business &amp; Skill Centre (SDC)</Link>
              </li>
              <li>
                <Link to="/courses?department=research-innovation">R&amp;D Block Innovation Labs</Link>
              </li>
              <li>
                <Link to="/courses?department=digital-library">Central Library &amp; Archives (L-Block)</Link>
              </li>
            </ul>
          </div>

          {/* University Portal Links */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', color: 'var(--text-primary)' }}>
              Learning Portal
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <li>
                <Link to="/">Campus Homepage</Link>
              </li>
              <li>
                <Link to="/courses">Course Catalog</Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to={portalPath}>My Role Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/profile">Account Profile</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">University Sign In</Link>
                  </li>
                  <li>
                    <Link to="/signup">Create Scholar Account</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Platform Overview */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', color: 'var(--text-primary)' }}>
              Academic Infrastructure
            </h4>
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
                <Compass size={15} style={{ color: 'var(--accent-bronze)' }} /> KLU Digital Twin + LMS
              </div>
              <div>Interactive WebGL 3D campus tour linked with department syllabi, classroom modules, and verified faculty exams.</div>
              <Link
                to="/courses"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                <BookOpen size={14} /> Browse Accredited Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          <span>© {new Date().getFullYear()} LearnSphere • KL University Digital Twin &amp; Academic LMS</span>
          <span>Vaddeswaram Campus • Role-Based Academic Environment</span>
        </div>
      </div>
    </footer>
  );
}
