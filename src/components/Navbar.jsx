import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  BookOpen,
  LayoutDashboard,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Bell,
  CheckCheck,
  FileText,
  GraduationCap,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCourses } from '../context/CourseContext';
import { formatTimeAgo } from '../utils/helpers';

export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadNotificationsCount, markNotifRead, markAllNotifsRead } = useCourses();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const dashboardPath =
    role === 'admin'
      ? '/admin-dashboard'
      : role === 'instructor'
      ? '/instructor-dashboard'
      : '/student-dashboard';

  const navItems = isAuthenticated
    ? role === 'admin'
      ? [
          { path: '/', label: 'Campus Home', icon: <Building2 size={15} /> },
          { path: '/courses', label: 'Course Catalog', icon: <BookOpen size={15} /> },
          { path: '/admin-dashboard', label: 'Governance Console', icon: <Shield size={15} /> }
        ]
      : role === 'instructor'
      ? [
          { path: '/', label: 'Campus Home', icon: <Building2 size={15} /> },
          { path: '/courses', label: 'Course Catalog', icon: <BookOpen size={15} /> },
          { path: '/instructor-dashboard', label: 'Faculty Studio', icon: <GraduationCap size={15} /> }
        ]
      : [
          { path: '/', label: 'Campus Home', icon: <Building2 size={15} /> },
          { path: '/courses', label: 'Courses', icon: <BookOpen size={15} /> },
          { path: '/student-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
          { path: '/my-courses', label: 'My Courses', icon: <GraduationCap size={15} /> },
          { path: '/assignments', label: 'Assignments', icon: <FileText size={15} /> }
        ]
    : [
        { path: '/', label: 'Campus Home', icon: <Building2 size={15} /> },
        { path: '/courses', label: 'Course Catalog', icon: <BookOpen size={15} /> }
      ];

  return (
    <header className="ls-navbar">
      <div className="ls-navbar-inner">
        {/* Left: Brand Identity */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--btn-primary-text)',
              flexShrink: 0
            }}
          >
            <Building2 size={19} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.08rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}
            >
              LearnSphere
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: 'var(--accent-bronze)',
                textTransform: 'uppercase',
                letterSpacing: '0.09em'
              }}
            >
              KL University LMS
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav
          className="desktop-nav-links"
          aria-label="Primary Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 13px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Utilities & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="ls-icon-btn"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Daylight Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Real Notifications Bell */}
              <div className="ls-notif-wrap" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="ls-icon-btn"
                  aria-label="Academic Notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell size={17} />
                  {unreadNotificationsCount > 0 && (
                    <span className="ls-notif-badge">{unreadNotificationsCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="ls-dropdown-popover" role="dialog" aria-label="Notifications">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                        Notifications ({unreadNotificationsCount} unread)
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotifsRead}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCheck size={13} /> Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          No university notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => {
                          const isRead = (n.readBy || []).includes(user?.id);
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => markNotifRead(n.id)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                borderBottom: '1px solid var(--border-subtle)',
                                padding: '11px 14px',
                                background: isRead ? 'transparent' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                fontFamily: 'inherit'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {n.title}
                                </span>
                                {!isRead && (
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      background: 'var(--accent-bronze)',
                                      flexShrink: 0
                                    }}
                                  />
                                )}
                              </div>
                              <span style={{ fontSize: '0.77rem', color: 'var(--text-secondary)' }}>{n.body}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {formatTimeAgo(n.createdAt)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu Dropdown */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '4px 10px 4px 5px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="ls-profile-name">
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user?.name}
                    </div>
                    <div
                      className="ls-profile-role"
                      style={{ fontSize: '0.67rem', color: 'var(--accent-bronze)', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                      {role}
                    </div>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </button>

                {dropdownOpen && (
                  <div className="ls-dropdown-popover" style={{ width: '235px', padding: '8px' }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>

                    <Link
                      to={dashboardPath}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '9px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '9px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      <UserIcon size={15} /> Profile Settings
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '9px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent-rose)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '4px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontFamily: 'inherit'
                      }}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" data-magnetic="true" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/signup" data-magnetic="true" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="mobile-menu-btn ls-icon-btn"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 'var(--navbar-height)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 99,
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 12px',
                borderRadius: 'var(--radius-sm)',
                background: location.pathname === item.path ? 'var(--bg-secondary)' : 'transparent',
                color: location.pathname === item.path ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.92rem'
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}

          {!isAuthenticated ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger btn-sm"
              style={{ marginTop: '6px' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
