import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  Compass,
  FileText,
  Bell,
  Activity,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DepthCard from '../components/DepthCard';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { formatDate, formatTimeAgo } from '../utils/helpers';

export default function StudentDashboard() {
  const { user } = useAuth();
  const {
    enrolledCourses,
    progress,
    completedLessons,
    quizResults,
    assignments,
    announcements,
    notifications,
    unreadNotificationsCount,
    activityLog,
    markNotifRead
  } = useCourses();

  const totalProgressSum = enrolledCourses.reduce((acc, c) => acc + (progress[c.id] || 0), 0);
  const avgProgress = enrolledCourses.length > 0 ? Math.round(totalProgressSum / enrolledCourses.length) : 0;

  const passedQuizzes = Object.values(quizResults).filter((q) => q.passed).length;
  const quizAttempts = Object.values(quizResults).length;
  const avgQuizScore =
    quizAttempts > 0
      ? Math.round(Object.values(quizResults).reduce((sum, q) => sum + (q.percentage || 0), 0) / quizAttempts)
      : 0;

  const pendingAssignments = assignments.filter((a) => a.status === 'Pending');
  const gradedAssignments = assignments.filter((a) => a.status === 'Graded');

  const resumeCourse = enrolledCourses[0] || null;

  // Radial SVG gauge math
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - avgProgress / 100);

  // Real milestone progression computed dynamically
  const dynamicAchievements = [
    {
      id: 'first_enroll',
      title: 'Enrolled Scholar',
      description: 'Enrolled in at least 1 university course.',
      unlocked: enrolledCourses.length >= 1,
      progressLabel: `${Math.min(enrolledCourses.length, 1)}/1`
    },
    {
      id: 'lesson_milestones',
      title: 'Curriculum Explorer',
      description: 'Completed 5 or more classroom lectures.',
      unlocked: completedLessons.length >= 5,
      progressLabel: `${Math.min(completedLessons.length, 5)}/5`
    },
    {
      id: 'certified_exam',
      title: 'Exam Distinction',
      description: 'Passed a certification exam at 60% or above.',
      unlocked: passedQuizzes >= 1,
      progressLabel: `${Math.min(passedQuizzes, 1)}/1`
    },
    {
      id: 'coursework_ace',
      title: 'Graded Deliverable',
      description: 'Earned faculty score & remarks on submitted coursework.',
      unlocked: gradedAssignments.length >= 1,
      progressLabel: `${Math.min(gradedAssignments.length, 1)}/1`
    }
  ];
  const unlockedCount = dynamicAchievements.filter((a) => a.unlocked).length;

  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeStreak = Number(user?.streak || 1);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Top Greeting Header with Radial Mastery Indicator */}
        <div
          className="glass-panel"
          style={{
            padding: '24px 28px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            borderTop: '2px solid var(--accent-bronze)'
          }}
        >
          <div>
            <span className="badge badge-bronze" style={{ marginBottom: '8px' }}>
              KL University Student Portal • {user?.department || 'Engineering'}
            </span>
            <h1 className="welcome-title">Welcome back, {user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              {user?.headline || 'Degree Scholar'} • University ID: {user?.studentId || 'KL-2026'}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              {resumeCourse ? (
                <Link to={`/classroom/${resumeCourse.id}`} className="btn btn-primary btn-sm" data-magnetic="true">
                  <Play size={14} /> Resume: {resumeCourse.title}
                </Link>
              ) : (
                <Link to="/courses" className="btn btn-primary btn-sm" data-magnetic="true">
                  <BookOpen size={14} /> Browse Course Catalog
                </Link>
              )}
              <Link to="/" className="btn btn-outline btn-sm">
                <Compass size={14} /> Open 3D Campus
              </Link>
            </div>
          </div>

          {/* Radial SVG Completion Ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
              <svg width="92" height="92" viewBox="0 0 92 92">
                <circle
                  cx="46"
                  cy="46"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="7"
                />
                <circle
                  cx="46"
                  cy="46"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--accent-bronze)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  transform="rotate(-90 46 46)"
                  style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1 }}>{avgProgress}%</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mastery</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Computed KPI Telemetry Cards */}
        <div className="stats-grid">
          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(142, 178, 217, 0.14)', color: 'var(--accent-cyan)' }}>
              <BookOpen size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{enrolledCourses.length}</span>
              <span className="stat-name">Enrolled Courses ({completedLessons.length} lessons)</span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(45, 176, 141, 0.14)', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{avgProgress}%</span>
              <span className="stat-name">Syllabus Mastery Rate</span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(218, 160, 66, 0.14)', color: 'var(--accent-amber)' }}>
              <Award size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{passedQuizzes} / {Math.max(enrolledCourses.length, quizAttempts)}</span>
              <span className="stat-name">
                Exams Certified {quizAttempts > 0 ? `(${avgQuizScore}% avg)` : ''}
              </span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(224, 88, 104, 0.14)', color: 'var(--accent-rose)' }}>
              <FileText size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{pendingAssignments.length}</span>
              <span className="stat-name">Pending Due • {unreadNotificationsCount} Alerts</span>
            </div>
          </DepthCard>
        </div>

        {/* Quick-Access Learning Workspace Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: '10px',
            marginBottom: '26px'
          }}
        >
          <Link to="/my-courses" className="glass-panel" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.86rem' }}>
            <BookOpen size={16} style={{ color: 'var(--accent-bronze)' }} /> My Courses
          </Link>
          <Link to="/assignments" className="glass-panel" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.86rem' }}>
            <FileText size={16} style={{ color: 'var(--accent-amber)' }} /> Coursework Queue ({pendingAssignments.length})
          </Link>
          <Link to="/progress" className="glass-panel" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.86rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-cyan)' }} /> Progress Telemetry
          </Link>
          <Link to="/certificates" className="glass-panel" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.86rem' }}>
            <GraduationCap size={16} style={{ color: 'var(--accent-emerald)' }} /> Degree Certificates
          </Link>
        </div>

        {/* Learning Streak Bar */}
        <div className="streak-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(212, 168, 114, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-bronze)'
              }}
            >
              <Flame size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800 }}>{activeStreak}-Day Active Study Streak</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {completedLessons.length > 0
                  ? `${completedLessons.length} completed lectures and ${gradedAssignments.length} graded assignments recorded.`
                  : 'Complete your first classroom lecture to initiate study cadence tracking.'}
              </p>
            </div>
          </div>

          <div className="streak-days-track">
            {streakDays.map((day, idx) => (
              <div key={idx} className={`streak-day-dot ${idx < Math.min(7, activeStreak) ? 'active' : ''}`}>
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Active Courses Grid */}
        <div className="section-title-row">
          <div>
            <h2 style={{ fontSize: '1.28rem' }}>Active Academic Enrollments</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Continue lectures or launch course examinations
            </p>
          </div>
          <Link to="/my-courses" style={{ color: 'var(--accent-bronze)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            All Enrollments <ArrowRight size={14} />
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '38px', textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '6px' }}>No Enrolled Courses Yet</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '18px', maxWidth: '460px', marginInline: 'auto' }}>
              Explore KL University accredited courses in the catalog to start attending classrooms and tracking mastery.
            </p>
            <Link to="/courses" className="btn btn-primary btn-sm">
              Explore Course Catalog <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="courses-grid-3d">
            {enrolledCourses.map((course) => {
              const currentPct = progress[course.id] || 0;
              const quizScore = quizResults[course.id];

              return (
                <DepthCard key={course.id} className="course-card-3d" cursorLabel="RESUME">
                  <div className="course-card-banner">
                    <img src={course.image} alt={course.title} className="course-card-img" />
                    <span className="badge" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {course.departmentName}
                    </span>
                  </div>

                  <div className="course-card-content">
                    <div className="course-card-dept">{course.badge || 'Coursework'}</div>
                    <h3 className="course-card-title">{course.title}</h3>
                    <div className="course-card-meta">
                      <span>Faculty: {course.instructor}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {course.duration}
                      </span>
                    </div>

                    <div className="course-progress-track">
                      <div className="course-progress-fill" style={{ width: `${currentPct}%` }} />
                    </div>
                    <div className="course-progress-label">
                      <span>Completion Progress</span>
                      <strong style={{ color: currentPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-bronze)' }}>
                        {currentPct}%
                      </strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                      <Link to={`/classroom/${course.id}`} className="btn btn-primary btn-sm" style={{ fontSize: '0.8rem' }}>
                        <Play size={13} /> Resume Class
                      </Link>
                      <Link to={`/quiz/${course.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                        {quizScore ? `Exam: ${quizScore.percentage}%` : 'Take Exam'}
                      </Link>
                    </div>
                  </div>
                </DepthCard>
              );
            })}
          </div>
        )}

        {/* Middle Tier: Deadlines & Notices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div className="section-title-row">
              <h3 style={{ fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-bronze)' }} /> Upcoming Assignments &amp; Grades
              </h3>
              <Link to="/assignments" style={{ fontSize: '0.8rem', color: 'var(--accent-bronze)', fontWeight: 700 }}>
                View All ({assignments.length})
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.slice(0, 4).map((assign) => {
                const isOverdue = assign.status === 'Pending' && new Date(assign.dueDate) < new Date('2026-11-26');
                return (
                  <div
                    key={assign.id}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {assign.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {assign.course} • Due {formatDate(assign.dueDate)}
                      </div>
                    </div>

                    {assign.status === 'Graded' ? (
                      <span className="badge badge-emerald">{assign.grade}/100</span>
                    ) : assign.status === 'Submitted' ? (
                      <span className="badge badge-cyan">Submitted</span>
                    ) : (
                      <Link to="/assignments" className={`btn btn-sm ${isOverdue ? 'btn-accent-bronze' : 'btn-primary'}`}>
                        {isOverdue ? 'Due Soon' : 'Submit'}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div className="section-title-row">
              <h3 style={{ fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} style={{ color: 'var(--accent-cyan)' }} /> Faculty Notices &amp; Alerts
              </h3>
              <span className="badge badge-amber">{unreadNotificationsCount} Unread</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${ann.priority === 'Important' ? 'var(--accent-bronze)' : 'var(--accent-cyan)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{ann.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatTimeAgo(ann.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{ann.message}</p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {ann.courseTitle} • {ann.authorName}
                  </div>
                </div>
              ))}

              {notifications.slice(0, 2).map((n) => {
                const isRead = (n.readBy || []).includes(user?.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markNotifRead(n.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: isRead ? 'transparent' : 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{n.title}</span>
                      {!isRead && <span className="badge badge-bronze">New</span>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.body}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Tier: Quiz & Certificates + Achievements + Recent Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
          {/* Quiz Performance & Certificate Eligibility */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div className="section-title-row">
              <h3 style={{ fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} style={{ color: 'var(--accent-emerald)' }} /> Quizzes &amp; Credentials
              </h3>
              <Link to="/certificates" style={{ fontSize: '0.8rem', color: 'var(--accent-bronze)', fontWeight: 700 }}>
                Certificates
              </Link>
            </div>

            {quizAttempts === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No examinations attempted yet. Pass any course assessment above 60% to unlock its registrar certificate.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {Object.entries(quizResults).map(([cid, q]) => {
                  const crs = enrolledCourses.find((c) => Number(c.id) === Number(cid));
                  return (
                    <div
                      key={cid}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{crs?.title || `Course #${cid}`}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {q.score}/{q.total} correct • {formatTimeAgo(q.date)}
                        </div>
                      </div>
                      <span className={`badge ${q.passed ? 'badge-emerald' : 'badge-rose'}`}>
                        {q.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Milestones */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div className="section-title-row">
              <h3 style={{ fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-amber)' }} /> Academic Milestones
              </h3>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {unlockedCount} of {dynamicAchievements.length} Earned
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {dynamicAchievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${ach.unlocked ? 'rgba(45, 176, 141, 0.35)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{ach.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{ach.description}</div>
                  </div>
                  <span className={`badge ${ach.unlocked ? 'badge-emerald' : 'badge-amber'}`}>
                    {ach.unlocked ? 'Earned' : ach.progressLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Activity Timeline */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div className="section-title-row">
              <h3 style={{ fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--accent-cyan)' }} /> Academic Timeline
              </h3>
              <Link to="/progress" style={{ fontSize: '0.8rem', color: 'var(--accent-bronze)', fontWeight: 700 }}>
                Telemetry
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {activityLog.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '2px solid var(--accent-bronze)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.83rem' }}>{act.targetTitle}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {act.actorName} — {act.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
