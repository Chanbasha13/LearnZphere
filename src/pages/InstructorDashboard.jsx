import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Bell,
  BarChart3,
  X,
  Upload,
  Search,
  Award,
  ExternalLink,
  Pencil,
  Activity
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DepthCard from '../components/DepthCard';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { DEPARTMENTS } from '../data/departmentsData';
import { formatDate, formatTimeAgo } from '../utils/helpers';

export default function InstructorDashboard() {
  const { user, allUsers } = useAuth();
  const {
    courses,
    studentStates,
    assignments,
    announcements,
    materials,
    createCourse,
    editCourse,
    removeCourse,
    createAssignment,
    gradeAssignment,
    addAnnouncement,
    removeAnnouncement,
    addMaterial,
    removeMaterial,
    getQuizForCourse,
    addQuizQuestion,
    removeQuizQuestion,
    activityLog
  } = useCourses();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'courses';
  const setActiveTab = (tab) => setSearchParams(tab === 'courses' ? {} : { tab });

  // Student analytics calculations (100% real from localStorage records)
  const studentUsers = useMemo(
    () => (allUsers || []).filter((u) => u.role === 'student'),
    [allUsers]
  );

  const studentRows = useMemo(() => {
    return studentUsers.map((stu) => {
      const st = studentStates[stu.id] || {
        enrolled: [],
        progress: {},
        completedLessons: [],
        quizResults: {}
      };
      const enrolledList = st.enrolled || [];
      const avgPct =
        enrolledList.length > 0
          ? Math.round(
              enrolledList.reduce((acc, cid) => acc + (st.progress?.[cid] || 0), 0) / enrolledList.length
            )
          : 0;
      const quizzes = Object.values(st.quizResults || {});
      const passedExams = quizzes.filter((q) => q.passed).length;
      const avgQuiz =
        quizzes.length > 0
          ? Math.round(quizzes.reduce((s, q) => s + (q.percentage || 0), 0) / quizzes.length)
          : null;

      return {
        ...stu,
        enrolledIds: enrolledList,
        avgPct,
        completedCount: (st.completedLessons || []).length,
        passedExams,
        quizCount: quizzes.length,
        avgQuiz
      };
    });
  }, [studentUsers, studentStates]);

  const totalEnrollments = studentRows.reduce((s, r) => s + r.enrolledIds.length, 0);
  const submittedForReview = assignments.filter((a) => a.status === 'Submitted');
  const gradedAssignments = assignments.filter((a) => a.status === 'Graded' && a.grade != null);
  const avgAssignmentGrade =
    gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((s, a) => s + Number(a.grade), 0) / gradedAssignments.length)
      : null;

  const allQuizAttempts = studentRows.reduce((acc, s) => acc + s.quizCount, 0);
  const allQuizPasses = studentRows.reduce((acc, s) => acc + s.passedExams, 0);
  const cohortPassRate =
    allQuizAttempts > 0 ? Math.round((allQuizPasses / allQuizAttempts) * 100) : null;

  // Modals & Interactive Forms
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    departmentId: 'computer-science',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    badge: '',
    description: ''
  });

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    departmentId: 'computer-science',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    description: '',
    badge: 'Faculty Module',
    lesson1Title: 'Orientation & System Foundations',
    lesson2Title: 'Applied Laboratory Workshop'
  });

  const [materialCourseId, setMaterialCourseId] = useState(1);
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'PDF', summary: '' });

  const [studentSearch, setStudentSearch] = useState('');
  const [assignFilter, setAssignFilter] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    courseId: 1,
    dueDate: '2026-12-15',
    points: 100,
    description: '',
    instructions: ''
  });

  const [gradingTarget, setGradingTarget] = useState(null);
  const [gradeValue, setGradeValue] = useState('92');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [quizCourseId, setQuizCourseId] = useState(1);
  const [quizForm, setQuizForm] = useState({
    question: '',
    opt0: '',
    opt1: '',
    opt2: '',
    opt3: '',
    answer: 0,
    explanation: ''
  });

  const [annForm, setAnnForm] = useState({
    courseId: 'all',
    priority: 'General',
    title: '',
    message: ''
  });

  const [bannerMsg, setBannerMsg] = useState('');

  useEffect(() => {
    if (!bannerMsg) return undefined;
    const t = setTimeout(() => setBannerMsg(''), 3500);
    return () => clearTimeout(t);
  }, [bannerMsg]);

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;
    const dept = DEPARTMENTS.find((d) => d.id === courseForm.departmentId) || DEPARTMENTS[0];
    createCourse({
      title: courseForm.title.trim(),
      instructor: user?.name || 'Dr. Sarah Johnson',
      instructorRole: user?.headline || 'KL University Faculty Lead',
      departmentId: dept.id,
      departmentName: dept.name,
      difficulty: courseForm.difficulty,
      duration: courseForm.duration,
      description:
        courseForm.description.trim() ||
        `Accredited degree module supervised by ${user?.name || 'Faculty'} under ${dept.name}.`,
      badge: courseForm.badge || 'Faculty Module',
      modules: [
        {
          id: 'mod-1',
          title: 'Module 1: Core Architecture & Syllabus',
          lessons: [
            {
              id: `custom-${Date.now()}-1`,
              title: courseForm.lesson1Title.trim() || 'Lecture 1: Architecture Foundations',
              duration: '18:00',
              videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
              completed: false
            },
            {
              id: `custom-${Date.now()}-2`,
              title: courseForm.lesson2Title.trim() || 'Lecture 2: Laboratory Implementation',
              duration: '24:00',
              videoUrl: 'https://www.youtube.com/embed/kUMe1FH4CHE',
              completed: false
            }
          ]
        }
      ]
    });
    setCourseForm({
      title: '',
      departmentId: 'computer-science',
      difficulty: 'Intermediate',
      duration: '8 weeks',
      description: '',
      badge: 'Faculty Module',
      lesson1Title: 'Orientation & System Foundations',
      lesson2Title: 'Applied Laboratory Workshop'
    });
    setCourseModalOpen(false);
    setBannerMsg('New faculty course published to the university catalog.');
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourse(course);
    setEditCourseForm({
      title: course.title || '',
      departmentId: course.departmentId || 'computer-science',
      difficulty: course.difficulty || 'Intermediate',
      duration: course.duration || '8 weeks',
      badge: course.badge || 'Coursework',
      description: course.description || ''
    });
  };

  const handleSaveEditCourse = (e) => {
    e.preventDefault();
    if (!editingCourse || !editCourseForm.title.trim()) return;
    const dept = DEPARTMENTS.find((d) => d.id === editCourseForm.departmentId) || DEPARTMENTS[0];
    editCourse(editingCourse.id, {
      title: editCourseForm.title.trim(),
      departmentId: dept.id,
      departmentName: dept.name,
      difficulty: editCourseForm.difficulty,
      duration: editCourseForm.duration,
      badge: editCourseForm.badge.trim() || 'Accredited Track',
      description: editCourseForm.description.trim()
    });
    setEditingCourse(null);
    setBannerMsg(`Updated course curriculum record for "${editCourseForm.title.trim()}".`);
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!materialForm.title.trim()) return;
    addMaterial({
      courseId: Number(materialCourseId),
      title: materialForm.title.trim(),
      type: materialForm.type,
      summary: materialForm.summary.trim() || 'Uploaded faculty study handout.'
    });
    setMaterialForm({ title: '', type: 'PDF', summary: '' });
    setBannerMsg('Learning material attached and visible in Classroom Resources.');
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!assignForm.title.trim()) return;
    const course = courses.find((c) => Number(c.id) === Number(assignForm.courseId)) || courses[0];
    createAssignment({
      title: assignForm.title.trim(),
      courseId: course.id,
      course: course.title,
      department: course.departmentName,
      description: assignForm.description.trim() || 'Complete the deliverables and submit evaluation writeup.',
      dueDate: assignForm.dueDate,
      points: assignForm.points,
      instructions: assignForm.instructions.trim() || 'Upload concise technical documentation.'
    });
    setAssignForm({ title: '', courseId: 1, dueDate: '2026-12-15', points: 100, description: '', instructions: '' });
    setAssignModalOpen(false);
    setBannerMsg('Assignment published and students notified.');
  };

  const openGradeModal = (assign) => {
    setGradingTarget(assign);
    setGradeValue(assign.grade != null ? String(assign.grade) : '90');
    setGradeFeedback(assign.feedback || '');
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!gradingTarget) return;
    const numeric = Math.max(0, Math.min(Number(gradingTarget.points || 100), Number(gradeValue) || 0));
    gradeAssignment(gradingTarget.id, numeric, gradeFeedback.trim());
    setGradingTarget(null);
    setBannerMsg(`Grade (${numeric}/${gradingTarget.points}) saved for "${gradingTarget.title}".`);
  };

  const handleAddQuizQuestion = (e) => {
    e.preventDefault();
    if (!quizForm.question.trim() || !quizForm.opt0.trim() || !quizForm.opt1.trim()) return;
    addQuizQuestion(Number(quizCourseId), {
      question: quizForm.question.trim(),
      options: [
        quizForm.opt0.trim(),
        quizForm.opt1.trim(),
        quizForm.opt2.trim() || 'All of the above',
        quizForm.opt3.trim() || 'None of the above'
      ],
      answer: Number(quizForm.answer) || 0,
      explanation: quizForm.explanation.trim() || 'Verified faculty assessment rationale.'
    });
    setQuizForm({ question: '', opt0: '', opt1: '', opt2: '', opt3: '', answer: 0, explanation: '' });
    setBannerMsg('Question added to live course examination bank.');
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.message.trim()) return;
    const selectedCourse =
      annForm.courseId === 'all'
        ? null
        : courses.find((c) => Number(c.id) === Number(annForm.courseId));
    addAnnouncement({
      courseId: selectedCourse ? selectedCourse.id : null,
      courseTitle: selectedCourse ? selectedCourse.title : 'All Campus Cohorts',
      priority: annForm.priority,
      title: annForm.title.trim(),
      message: annForm.message.trim()
    });
    setAnnForm({ courseId: 'all', priority: 'General', title: '', message: '' });
    setBannerMsg('Announcement broadcast to enrolled scholars.');
  };

  const filteredStudents = studentRows.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredAssignments = assignments.filter((a) => {
    if (assignFilter === 'all') return true;
    return a.status.toLowerCase() === assignFilter;
  });

  const activeQuizList = getQuizForCourse(quizCourseId);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <span className="badge badge-bronze" style={{ marginBottom: '6px' }}>
              Faculty Studio • {user?.department || 'Academic Division'}
            </span>
            <h1 className="welcome-title">Instructor Workspace &amp; Grading</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Manage curriculum modules, learning resources, student evaluations, quiz banks, and announcements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setAssignModalOpen(true)} className="btn btn-outline btn-sm">
              <FileText size={15} /> + Assignment
            </button>
            <button type="button" onClick={() => setCourseModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} /> Publish Course
            </button>
          </div>
        </div>

        {bannerMsg && (
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
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{bannerMsg}</span>
            <button type="button" onClick={() => setBannerMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* 4 Computed Faculty Stats */}
        <div className="stats-grid">
          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(142, 178, 217, 0.14)', color: 'var(--accent-cyan)' }}>
              <BookOpen size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{courses.length}</span>
              <span className="stat-name">Active Courses ({materials.length} Resources)</span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(45, 176, 141, 0.14)', color: 'var(--accent-emerald)' }}>
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{studentUsers.length}</span>
              <span className="stat-name">Active Students ({totalEnrollments} enrollments)</span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(218, 160, 66, 0.14)', color: 'var(--accent-amber)' }}>
              <FileText size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{submittedForReview.length}</span>
              <span className="stat-name">
                Needs Grading {avgAssignmentGrade !== null ? `• ${avgAssignmentGrade}% Avg` : ''}
              </span>
            </div>
          </DepthCard>

          <DepthCard className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(212, 168, 114, 0.14)', color: 'var(--accent-bronze)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-num">{cohortPassRate !== null ? `${cohortPassRate}%` : '—'}</span>
              <span className="stat-name">Exam Pass Rate ({allQuizPasses}/{allQuizAttempts})</span>
            </div>
          </DepthCard>
        </div>

        {/* Workspace Tab Navigation */}
        <div className="dash-tabs-bar" role="tablist">
          {[
            { id: 'courses', label: 'Courses & Materials', icon: <BookOpen size={15} /> },
            { id: 'students', label: `Students (${studentUsers.length})`, icon: <Users size={15} /> },
            { id: 'assignments', label: `Assignments (${assignments.length})`, icon: <FileText size={15} /> },
            { id: 'quizzes', label: 'Quiz Bank', icon: <HelpCircle size={15} /> },
            { id: 'announcements', label: `Notices (${announcements.length})`, icon: <Bell size={15} /> },
            { id: 'analytics', label: 'Cohort Analytics', icon: <BarChart3 size={15} /> }
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

        {/* TAB 1: COURSES & MATERIALS */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <div className="section-title-row">
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>Curriculum &amp; Course Catalog</h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Inspect student enrollment counts per course or publish new degree modules
                  </p>
                </div>
                <button type="button" onClick={() => setCourseModalOpen(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add Course
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Faculty Unit</th>
                      <th>Enrolled Students</th>
                      <th>Level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => {
                      const isCustom = Number(course.id) > 10;
                      const enrolledCount = studentRows.filter((s) =>
                        s.enrolledIds.includes(Number(course.id))
                      ).length;
                      return (
                        <tr key={course.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{course.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {course.instructor} • {course.duration}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-cyan">{course.departmentName}</span>
                          </td>
                          <td>
                            <strong>{enrolledCount}</strong> enrolled
                          </td>
                          <td>{course.difficulty}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCourse(course)}
                                className="btn btn-secondary btn-sm"
                                title="Edit course metadata"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              <Link to={`/classroom/${course.id}`} className="btn btn-outline btn-sm">
                                <ExternalLink size={13} /> Class
                              </Link>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => removeCourse(course.id)}
                                  className="btn btn-danger btn-sm"
                                  title="Archive custom course"
                                >
                                  <Trash2 size={13} />
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
            </div>

            {/* Materials Management Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.12rem', marginBottom: '6px' }}>Learning Materials &amp; Handouts</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Attach downloadable study sheets, slides, and code references that render live inside each Classroom Resources tab.
              </p>

              <form onSubmit={handleAddMaterial} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Course</label>
                  <select
                    className="form-select"
                    value={materialCourseId}
                    onChange={(e) => setMaterialCourseId(Number(e.target.value))}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Resource Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Week 4 Recursion Workbook"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Format</label>
                  <select
                    className="form-select"
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
                  >
                    <option value="PDF">PDF Sheet</option>
                    <option value="Slides">Lecture Slides</option>
                    <option value="Code">Code Repository</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                  <Upload size={15} /> Attach Material
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {materials.map((mat) => {
                  const targetCourse = courses.find((c) => Number(c.id) === Number(mat.courseId));
                  return (
                    <div
                      key={mat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '11px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{mat.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {targetCourse?.title || `Course #${mat.courseId}`} • {mat.type} • Uploaded by {mat.uploadedBy}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterial(mat.id)}
                        className="btn btn-danger btn-sm"
                        aria-label={`Remove ${mat.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS & PROGRESS */}
        {activeTab === 'students' && (
          <div>
            <div className="section-title-row">
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>Student Cohort &amp; Academic Progress</h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Live view across all registered students including new signups, lesson mastery, and examination grades
                </p>
              </div>
              <div style={{ position: 'relative', minWidth: '250px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px', paddingBlock: '8px', fontSize: '0.84rem' }}
                  placeholder="Filter by student name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scholar</th>
                    <th>Department</th>
                    <th>Enrolled Courses</th>
                    <th>Avg Completion</th>
                    <th>Exams Passed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((stu) => (
                    <tr key={stu.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={stu.avatar} alt={stu.name} style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{stu.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {stu.email} • {stu.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{stu.department}</td>
                      <td>
                        <span className="badge badge-cyan">{stu.enrolledIds.length} courses</span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {stu.completedCount} lessons done
                        </div>
                      </td>
                      <td>
                        <div style={{ width: '120px' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>{stu.avgPct}%</div>
                          <div className="course-progress-track" style={{ marginBottom: 0 }}>
                            <div className="course-progress-fill" style={{ width: `${stu.avgPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        {stu.quizCount > 0 ? (
                          <span className="badge badge-emerald">
                            {stu.passedExams}/{stu.quizCount} passed ({stu.avgQuiz}%)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No attempts yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS & GRADING */}
        {activeTab === 'assignments' && (
          <div>
            <div className="section-title-row">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'submitted', 'pending', 'graded'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAssignFilter(f)}
                    className={`btn btn-sm ${assignFilter === f ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {f === 'submitted' ? `Submitted (${submittedForReview.length})` : f}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setAssignModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Assignment
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAssignments.map((assign) => (
                <div key={assign.id} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ maxWidth: '720px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span
                          className={`badge ${
                            assign.status === 'Graded'
                              ? 'badge-emerald'
                              : assign.status === 'Submitted'
                              ? 'badge-cyan'
                              : 'badge-amber'
                          }`}
                        >
                          {assign.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {assign.course} • Due {formatDate(assign.dueDate)} • {assign.points} pts
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.08rem', marginBottom: '4px' }}>{assign.title}</h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{assign.description}</p>

                      {assign.submissionText && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.82rem'
                          }}
                        >
                          <strong>Submission ({assign.studentName || 'Student'}):</strong> {assign.submissionText}
                        </div>
                      )}

                      {assign.feedback && (
                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          Faculty Feedback ({assign.grade}/{assign.points}): {assign.feedback}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {assign.grade != null && (
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                          {assign.grade} / {assign.points}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => openGradeModal(assign)}
                        className={`btn btn-sm ${assign.status === 'Submitted' ? 'btn-primary' : 'btn-outline'}`}
                      >
                        <Award size={14} /> {assign.status === 'Graded' ? 'Update Grade' : 'Grade Deliverable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QUIZ BANK MANAGEMENT */}
        {activeTab === 'quizzes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.12rem', marginBottom: '12px' }}>Add Quiz Assessment Question</h3>
              <form onSubmit={handleAddQuizQuestion}>
                <div className="form-group">
                  <label className="form-label">Target Course Exam</label>
                  <select
                    className="form-select"
                    value={quizCourseId}
                    onChange={(e) => setQuizCourseId(Number(e.target.value))}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Prompt</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter examination question..."
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Option A</label>
                    <input
                      type="text"
                      className="form-input"
                      value={quizForm.opt0}
                      onChange={(e) => setQuizForm({ ...quizForm, opt0: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option B</label>
                    <input
                      type="text"
                      className="form-input"
                      value={quizForm.opt1}
                      onChange={(e) => setQuizForm({ ...quizForm, opt1: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option C</label>
                    <input
                      type="text"
                      className="form-input"
                      value={quizForm.opt2}
                      onChange={(e) => setQuizForm({ ...quizForm, opt2: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option D</label>
                    <input
                      type="text"
                      className="form-input"
                      value={quizForm.opt3}
                      onChange={(e) => setQuizForm({ ...quizForm, opt3: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correct Option</label>
                  <select
                    className="form-select"
                    value={quizForm.answer}
                    onChange={(e) => setQuizForm({ ...quizForm, answer: Number(e.target.value) })}
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Grading Explanation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Concise rationale shown after submission"
                    value={quizForm.explanation}
                    onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={15} /> Add Question to Course Exam
                </button>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div className="section-title-row">
                <h3 style={{ fontSize: '1.12rem' }}>Live Questions ({activeQuizList.length})</h3>
                <Link to={`/quiz/${quizCourseId}`} className="btn btn-outline btn-sm">
                  Preview Exam
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                {activeQuizList.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.88rem' }}>
                        Q{idx + 1}. {q.question}
                      </strong>
                      {activeQuizList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(quizCourseId, idx)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Delete Question"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      Answer: {q.options[q.answer]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FACULTY ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.12rem', marginBottom: '12px' }}>Broadcast Faculty Notice</h3>
              <form onSubmit={handlePostAnnouncement}>
                <div className="form-group">
                  <label className="form-label">Audience / Course</label>
                  <select
                    className="form-select"
                    value={annForm.courseId}
                    onChange={(e) => setAnnForm({ ...annForm, courseId: e.target.value })}
                  >
                    <option value="all">All Campus Cohorts</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={annForm.priority}
                    onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                  >
                    <option value="General">General Update</option>
                    <option value="Important">Important / Deadline Alert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Headline</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Studio Office Hours Rescheduled"
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Announcement Message</label>
                  <textarea
                    rows="4"
                    className="form-textarea"
                    placeholder="Write official notice details..."
                    value={annForm.message}
                    onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Bell size={15} /> Publish Notice
                </button>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.12rem', marginBottom: '14px' }}>Published Announcements ({announcements.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                      <div>
                        <span className={`badge ${ann.priority === 'Important' ? 'badge-bronze' : 'badge-cyan'}`} style={{ marginBottom: '4px' }}>
                          {ann.priority} • {ann.courseTitle}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{ann.title}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnnouncement(ann.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        aria-label={`Delete ${ann.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{ann.message}</p>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Posted by {ann.authorName} • {formatTimeAgo(ann.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COHORT ANALYTICS & RECENT ACTIVITIES */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '26px' }}>
              <h2 style={{ fontSize: '1.22rem', marginBottom: '6px' }}>Cohort Mastery &amp; Completion Telemetry</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Computed directly from student enrollments, completed lectures, and graded coursework.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {courses.map((course) => {
                  const enrolledInThis = studentRows.filter((s) => s.enrolledIds.includes(Number(course.id)));
                  const avgCompletion =
                    enrolledInThis.length > 0
                      ? Math.round(
                          enrolledInThis.reduce(
                            (acc, s) => acc + (studentStates[s.id]?.progress?.[course.id] || 0),
                            0
                          ) / enrolledInThis.length
                        )
                      : 0;
                  const courseAssignments = assignments.filter((a) => Number(a.courseId) === Number(course.id));
                  return (
                    <div
                      key={course.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{course.title}</strong>
                          <span style={{ marginLeft: '8px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {course.departmentName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                          <span>{enrolledInThis.length} Scholars</span>
                          <span>{courseAssignments.length} Tasks</span>
                          <span style={{ color: 'var(--accent-emerald)' }}>{avgCompletion}% Mastery</span>
                        </div>
                      </div>
                      <div className="course-progress-track" style={{ marginBottom: 0 }}>
                        <div className="course-progress-fill" style={{ width: `${avgCompletion}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '26px' }}>
              <div className="section-title-row">
                <h2 style={{ fontSize: '1.22rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: 'var(--accent-bronze)' }} /> Recent Faculty &amp; Cohort Activity
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
                {activityLog.slice(0, 10).map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '11px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '2px solid var(--accent-bronze)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{act.targetTitle}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {act.actorName} ({act.actorRole}) — {act.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Existing Course */}
        {editingCourse && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 12, 17, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Edit Course Details</h2>
                <button type="button" onClick={() => setEditingCourse(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveEditCourse}>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input type="text" className="form-input" value={editCourseForm.title} onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={editCourseForm.departmentId} onChange={(e) => setEditCourseForm({ ...editCourseForm, departmentId: e.target.value })}>
                      {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select className="form-select" value={editCourseForm.difficulty} onChange={(e) => setEditCourseForm({ ...editCourseForm, difficulty: e.target.value })}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input type="text" className="form-input" value={editCourseForm.duration} onChange={(e) => setEditCourseForm({ ...editCourseForm, duration: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Track Badge</label>
                    <input type="text" className="form-input" value={editCourseForm.badge} onChange={(e) => setEditCourseForm({ ...editCourseForm, badge: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Curriculum Summary</label>
                  <textarea rows="3" className="form-textarea" value={editCourseForm.description} onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setEditingCourse(null)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Course Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Publish Course */}
        {courseModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Publish New Faculty Course</h2>
                <button type="button" onClick={() => setCourseModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cloud Native Distributed Systems"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={courseForm.departmentId} onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select className="form-select" value={courseForm.difficulty} onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Lesson 1 Title</label>
                    <input type="text" className="form-input" value={courseForm.lesson1Title} onChange={(e) => setCourseForm({ ...courseForm, lesson1Title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lesson 2 Title</label>
                    <input type="text" className="form-input" value={courseForm.lesson2Title} onChange={(e) => setCourseForm({ ...courseForm, lesson2Title: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Curriculum Summary</label>
                  <textarea rows="3" className="form-textarea" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Describe technical outcomes..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setCourseModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Publish Course</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Assignment */}
        {assignModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Create Coursework Assignment</h2>
                <button type="button" onClick={() => setAssignModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label className="form-label">Assignment Title *</label>
                  <input type="text" className="form-input" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} placeholder="e.g. REST API Load Testing Lab" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select className="form-select" value={assignForm.courseId} onChange={(e) => setAssignForm({ ...assignForm, courseId: Number(e.target.value) })}>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Points</label>
                    <input type="number" className="form-input" value={assignForm.points} onChange={(e) => setAssignForm({ ...assignForm, points: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Specification</label>
                  <textarea rows="3" className="form-textarea" value={assignForm.description} onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="Deliverables and evaluation criteria..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setAssignModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Publish Assignment</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Grade Deliverable */}
        {gradingTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Evaluate Student Deliverable</h2>
                <button type="button" onClick={() => setGradingTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <strong>{gradingTarget.title}</strong> ({gradingTarget.course})
              </p>
              {gradingTarget.submissionText && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '16px' }}>
                  {gradingTarget.submissionText}
                </div>
              )}
              <form onSubmit={handleSaveGrade}>
                <div className="form-group">
                  <label className="form-label">Numeric Score (out of {gradingTarget.points || 100})</label>
                  <input type="number" min="0" max={gradingTarget.points || 100} className="form-input" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty Evaluation Feedback</label>
                  <textarea rows="3" className="form-textarea" placeholder="Constructive evaluation remarks..." value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setGradingTarget(null)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Confirm Grade</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
