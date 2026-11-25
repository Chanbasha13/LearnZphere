import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CourseProvider } from './context/CourseContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CustomCursor from './components/CustomCursor';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Learning from './pages/Learning';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import MyCourses from './pages/MyCourses';
import Assignments from './pages/Assignments';
import Progress from './pages/Progress';
import Certificates from './pages/Certificates';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';

import './styles/index.css';
import './styles/dashboard.css';
import './styles/campus3d.css';
import './styles/classroom.css';

function AppLayout() {
  const location = useLocation();
  const isClassroom = location.pathname.startsWith('/classroom/');

  return (
    <div className="app-shell">
      <CustomCursor />
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public University Experience */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/classroom/:id" element={<Learning />} />
          <Route path="/quiz/:id" element={<Quiz />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Student Portal */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Assignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Certificates />
              </ProtectedRoute>
            }
          />

          {/* Protected Shared Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Instructor Portal */}
          <Route
            path="/instructor-dashboard"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Portal */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isClassroom && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CourseProvider>
          <Router>
            <AppLayout />
          </Router>
        </CourseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
