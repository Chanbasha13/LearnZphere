import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { role, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="container"
        style={{
          minHeight: 'calc(100vh - var(--navbar-height))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontWeight: 600
        }}
      >
        Verifying university credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const dashboardHome =
      role === 'admin'
        ? '/admin-dashboard'
        : role === 'instructor'
        ? '/instructor-dashboard'
        : '/student-dashboard';
    return <Navigate to={dashboardHome} replace />;
  }

  return children;
}
