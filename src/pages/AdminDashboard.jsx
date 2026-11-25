import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  Building2,
  Plus,
  Trash2,
  Search,
  Download,
  X,
  BarChart3,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { DEPARTMENTS } from '../data/departmentsData';
import { formatTimeAgo } from '../utils/helpers';

export default function AdminDashboard() {
  const { user, allUsers, removeUserAccount, changeUserRole, createUserAccount } = useAuth();
  const { courses, createCourse, removeCourse, studentStates, assignments, announcements, activityLog } = useCourses();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'courses';
  const setActiveTab = (tab) => setSearchParams(tab === 'courses' ? {} : { tab });

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: 'Dr. Elena Vance',
    departmentId: 'computer-science',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    description: '',
    badge: 'Senate Accredited'
  });

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'student',
    department: DEPARTMENTS[0].name,
    password: 'password123'
  });
  const [adminStatus, setAdminStatus] = useState('');

  useEffect(() => {
    if (!adminStatus) return undefined;
    const t = setTimeout(() => setAdminStatus(''), 3500);
    return () => clearTimeout(t);
  }, [adminStatus]);

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;
    const dept = DEPARTMENTS.find((d) => d.id === courseForm.departmentId) || DEPARTMENTS[0];
    createCourse({
      title: courseForm.title.trim(),
      instructor: courseForm.instructor.trim() || 'KL University Faculty',
      instructorRole: 'Accredited Faculty Professor',
      departmentId: dept.id,
      departmentName: dept.name,
      difficulty: courseForm.difficulty,
      duration: courseForm.duration,
      description: courseForm.description.trim() || `University course under ${dept.name}.`,
      badge: courseForm.badge
    });
    setCourseForm({
      title: '',
      instructor: 'Dr. Elena Vance',
      departmentId: 'computer-science',
      difficulty: 'Intermediate',
      duration: '8 weeks',
      description: '',
      badge: 'Senate Accredited'
    });
    setIsAddCourseOpen(false);
    setAdminStatus('Accredited course published across platform.');
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) return;
    const res = createUserAccount(userForm);
    if (res.success) {
      setUserForm({
        name: '',
        email: '',
        role: 'student',
        department: DEPARTMENTS[0].name,
        password: 'password123'
      });
      setIsAddUserOpen(false);
      setAdminStatus(`Provisioned ${res.user.role} account for ${res.user.name}.`);
    } else {
      setAdminStatus(res.message);
    }
  };

  const handleExportBackup = () => {
    const dataSnapshot = {
      exportedAt: new Date().toISOString(),
      platform: 'LearnSphere KL University LMS',
      usersCount: allUsers.length,
      coursesCount: courses.length,
      users: allUsers.map(({ password, ...safe }) => safe),
      courses,
      studentStates,
      assignments,
      announcements,
      activityLog
    };
    const blob = new Blob([JSON.stringify(dataSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnsphere-klu-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.studentId || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Real computed reports metrics
  const reportsMetrics = useMemo(() => {
    const students = allUsers.filter((u) => u.role === 'student');
    const instructors = allUsers.filter((u) => u.role === 'instructor');
    const admins = allUsers.filter((u) => u.role === 'admin');
    const totalEnrollments = students.reduce((s, stu) => s + (studentStates[stu.id]?.enrolled?.length || 0), 0);
    const quizList = students.flatMap((stu) => Object.values(studentStates[stu.id]?.quizResults || {}));
    const passedQuizzes = quizList.filter((q) => q.passed).length;
    const submittedCount = assignments.filter((a) => a.status === 'Submitted').length;
    const gradedCount = assignments.filter((a) => a.status === 'Graded').length;

    return {
      studentsCount: students.length,
      instructorsCount: instructors.length,
      adminsCount: admins.length,
      totalEnrollments,
      quizAttempts: quizList.length,
      passedQuizzes,
      submittedCount,
      gradedCount
    };
  }, [allUsers, studentStates, assignments]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <span className="badge badge-bronze" style={{ marginBottom: '6px' }}>
              University Governance Console
            </span>
            <h1 className="welcome-title">Platform Administration &amp; Reports</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Govern accredited courses, campus block mappings, university roles, and live telemetry records.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleExportBackup} className="btn btn-outline btn-sm">
              <Download size={15} /> Export JSON Backup
            </button>
            <button type="button" onClick={() => setIsAddUserOpen(true)} className="btn btn-secondary btn-sm">
              <UserPlus size={15} /> Provision User
            </button>
            <button type="button" onClick={() => setIsAddCourseOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} /> New Course
            </button>
          </div>
        </div>

        {adminStatus && (
          <div
            role="status"
            style={{
              padding: '11px 16px',
              marginBottom: '20px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 118, 110, 0.1)',
              border: '1px solid rgba(15, 118, 110, 0.3)',
              color: 'var(--accent-emerald)',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{adminStatus}</span>
            <button type="button" onClick={() => setAdminStatus('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Top 4 Governance Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(22, 50, 79, 0.1)', color: 'var(--accent-cyan)' }}>
              <BookOpen size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{courses.length}</span>
              <span className="stat-name">Accredited Courses</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--accent-emerald)' }}>
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{allUsers.length}</span>
              <span className="stat-name">Registered Accounts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(154, 91, 37, 0.12)', color: 'var(--accent-bronze)' }}>
              <Building2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{DEPARTMENTS.length}</span>
              <span className="stat-name">Mapped Academic Blocks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(67, 56, 202, 0.1)', color: 'var(--accent-indigo)' }}>
              <Shield size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{reportsMetrics.totalEnrollments}</span>
              <span className="stat-name">Active Cohort Enrollments</span>
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="dash-tabs-bar" role="tablist">
          {[
            { id: 'courses', label: `Course Governance (${courses.length})`, icon: <BookOpen size={15} /> },
            { id: 'users', label: `User Management (${allUsers.length})`, icon: <Users size={15} /> },
            { id: 'departments', label: 'Campus Mapping', icon: <Building2 size={15} /> },
            { id: 'reports', label: 'Activity & Reports', icon: <BarChart3 size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: COURSES GOVERNANCE */}
        {activeTab === 'courses' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course Title</th>
                  <th>Faculty Unit</th>
                  <th>Lead Instructor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const isCustom = Number(course.id) > 10;
                  return (
                    <tr key={course.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        #{course.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{course.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {course.duration} • {course.difficulty}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{course.departmentName}</span>
                      </td>
                      <td>{course.instructor}</td>
                      <td>
                        <span className={`badge ${isCustom ? 'badge-amber' : 'badge-emerald'}`}>
                          {isCustom ? 'Faculty Added' : 'Core Curriculum'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/course/${course.id}`} className="btn btn-outline btn-sm">
                            <ExternalLink size={13} /> View
                          </Link>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => removeCourse(course.id)}
                              className="btn btn-danger btn-sm"
                              title="Remove Custom Course"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: USERS GOVERNANCE */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                  placeholder="Search user name, ID or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'student', 'instructor', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>University Member</th>
                    <th>Email</th>
                    <th>Role Permission</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatar} alt={u.name} style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{u.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '5px 9px', fontSize: '0.8rem', maxWidth: '140px' }}
                          value={u.role}
                          aria-label={`Role for ${u.name}`}
                          onChange={(e) => changeUserRole(u.id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.department}</td>
                      <td>
                        {u.id !== user?.id ? (
                          <button
                            type="button"
                            onClick={() => removeUserAccount(u.id)}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        ) : (
                          <span className="badge badge-emerald">Current Session</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAMPUS BLOCK & DEPARTMENT MAPPING */}
        {activeTab === 'departments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
            {DEPARTMENTS.map((dept) => {
              const deptCourses = courses.filter((c) => c.departmentId === dept.id);
              return (
                <div key={dept.id} className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-bronze">{dept.code}</span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      X:{dept.coordinates.x}m, Z:{dept.coordinates.z}m
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.08rem', marginBottom: '4px' }}>{dept.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '10px' }}>
                    {dept.buildingName} • {dept.dean}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>{dept.tagline}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{deptCourses.length} Modules Linked</span>
                    <Link to={`/?building=${dept.kluBuildingId}`} className="btn btn-outline btn-sm">
                      Inspect in 3D Twin
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: PLATFORM ACTIVITY & ANALYTICS REPORTS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Role Distribution</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px' }}>
                  {reportsMetrics.studentsCount} Students • {reportsMetrics.instructorsCount} Faculty • {reportsMetrics.adminsCount} Admins
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Assessment Certification</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px' }}>
                  {reportsMetrics.passedQuizzes} Passed / {reportsMetrics.quizAttempts} Attempts
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Coursework Grading Queue</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px' }}>
                  {reportsMetrics.submittedCount} Awaiting • {reportsMetrics.gradedCount} Graded
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.12rem', marginBottom: '14px' }}>Live Platform Activity Audit Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {activityLog.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{act.targetTitle}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {act.actorName} ({act.actorRole}) — {act.detail}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Course */}
        {isAddCourseOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Commission Accredited Course</h2>
                <button type="button" onClick={() => setIsAddCourseOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input type="text" className="form-input" placeholder="e.g. Quantum Algorithms II" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={courseForm.departmentId} onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}>
                    {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Lead Faculty</label>
                    <input type="text" className="form-input" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input type="text" className="form-input" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea rows="3" className="form-textarea" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Syllabus scope..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsAddCourseOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Publish Course</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Provision User Account */}
        {isAddUserOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Provision University Account</h2>
                <button type="button" onClick={() => setIsAddUserOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">University Email *</label>
                  <input type="email" className="form-input" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}>
                      {DEPARTMENTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input type="text" className="form-input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
