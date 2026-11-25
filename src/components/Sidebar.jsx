import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  TrendingUp,
  Award,
  User as UserIcon,
  Users,
  Layers,
  Bell,
  HelpCircle,
  BarChart3,
  Building2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = new URLSearchParams(location.search).get('tab');

  const studentLinks = [
    { path: '/student-dashboard', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { path: '/my-courses', label: 'My Courses', icon: <BookOpen size={17} /> },
    { path: '/assignments', label: 'Assignments', icon: <FileText size={17} /> },
    { path: '/progress', label: 'Progress & Telemetry', icon: <TrendingUp size={17} /> },
    { path: '/certificates', label: 'Certificates', icon: <Award size={17} /> },
    { path: '/profile', label: 'Profile Settings', icon: <UserIcon size={17} /> }
  ];

  const instructorLinks = [
    { path: '/instructor-dashboard', tab: null, label: 'Courses & Materials', icon: <BookOpen size={17} /> },
    { path: '/instructor-dashboard?tab=students', tab: 'students', label: 'Students & Progress', icon: <Users size={17} /> },
    { path: '/instructor-dashboard?tab=assignments', tab: 'assignments', label: 'Assignments & Grading', icon: <FileText size={17} /> },
    { path: '/instructor-dashboard?tab=quizzes', tab: 'quizzes', label: 'Quiz Bank', icon: <HelpCircle size={17} /> },
    { path: '/instructor-dashboard?tab=announcements', tab: 'announcements', label: 'Announcements', icon: <Bell size={17} /> },
    { path: '/instructor-dashboard?tab=analytics', tab: 'analytics', label: 'Cohort Analytics', icon: <BarChart3 size={17} /> },
    { path: '/profile', tab: 'profile', label: 'Profile Settings', icon: <UserIcon size={17} /> }
  ];

  const adminLinks = [
    { path: '/admin-dashboard?tab=courses', tab: 'courses', label: 'Course Governance', icon: <Layers size={17} /> },
    { path: '/admin-dashboard?tab=users', tab: 'users', label: 'User Governance', icon: <Users size={17} /> },
    { path: '/admin-dashboard?tab=departments', tab: 'departments', label: 'Campus Mapping', icon: <Building2 size={17} /> },
    { path: '/admin-dashboard?tab=reports', tab: 'reports', label: 'Activity & Reports', icon: <BarChart3 size={17} /> },
    { path: '/profile', tab: 'profile', label: 'Profile Settings', icon: <UserIcon size={17} /> }
  ];

  const activeList =
    role === 'admin' ? adminLinks : role === 'instructor' ? instructorLinks : studentLinks;

  const isLinkActive = (item) => {
    const cleanPath = item.path.split('?')[0];
    if (location.pathname !== cleanPath) return false;
    if (role === 'student' || cleanPath === '/profile') return true;
    if (!item.tab) return !currentTab || currentTab === 'courses';
    return currentTab === item.tab;
  };

  return (
    <aside className="dashboard-sidebar" aria-label="Workspace Navigation">
      <div
        className="sidebar-section-heading"
        style={{
          padding: '4px 12px 10px',
          fontSize: '0.7rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: 'var(--text-muted)'
        }}
      >
        {role === 'admin'
          ? 'Administration'
          : role === 'instructor'
          ? 'Faculty Workspace'
          : 'Academic Portal'}
      </div>

      {activeList.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`sidebar-nav-item ${isLinkActive(item) ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Bottom Authenticated Account Summary */}
      <div className="sidebar-user-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <img
            src={user?.avatar}
            alt={user?.name}
            className="user-avatar-sm"
          />
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.86rem',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                color: 'var(--text-primary)'
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {user?.studentId || role?.toUpperCase()}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="btn btn-outline btn-sm"
          style={{ width: '100%', fontSize: '0.78rem' }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
