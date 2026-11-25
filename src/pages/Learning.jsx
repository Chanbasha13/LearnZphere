import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  FileText,
  MessageSquare,
  Download,
  Menu,
  Send
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { getStoredItem, setStoredItem } from '../utils/storage';

export default function Learning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getCourseById, isLessonCompleted, markLessonComplete, progress, materials } = useCourses();
  const { isAuthenticated, user } = useAuth();

  const course = getCourseById(id);
  const allLessons = course?.modules?.flatMap((m) => m.lessons) || [];
  const courseMaterials = materials.filter((m) => Number(m.courseId) === Number(id));

  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('notes');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const forumKey = `learnSphere_forum_${id}`;
  const [forumPosts, setForumPosts] = useState(() =>
    getStoredItem(forumKey, [
      {
        id: 'post_1',
        author: 'Alex Morgan',
        time: '2 hours ago',
        body: 'Can faculty share sample edge-case benchmarks for module exercises?'
      }
    ])
  );
  const [newPost, setNewPost] = useState('');

  if (!course) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Course Classroom Unavailable</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  const currentLesson = allLessons[activeLessonIndex] || {
    id: `${id}-1`,
    title: 'Orientation Lecture',
    duration: '15:00',
    videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU'
  };

  const isCompleted = isLessonCompleted(currentLesson.id);
  const coursePct = progress[course.id] || 0;

  const handleToggleComplete = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    markLessonComplete(currentLesson.id, course.id, allLessons.length);
  };

  const handleDownloadHandout = (title, summary) => {
    const content = `# ${course.title}\n## ${title}\n\n${summary}\n\nLecture Focus: ${currentLesson.title} (${currentLesson.duration})\nFaculty: ${course.instructor}\nDepartment: ${course.departmentName}\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddForumPost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    const item = {
      id: `post_${Date.now()}`,
      author: user?.name || 'Guest Visitor',
      time: 'Just now',
      body: newPost.trim()
    };
    const next = [item, ...forumPosts];
    setForumPosts(next);
    setStoredItem(forumKey, next);
    setNewPost('');
  };

  return (
    <div className="classroom-container">
      {sidebarOpen && (
        <aside className="classroom-sidebar">
          <div className="classroom-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Classroom Syllabus</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 9px', fontSize: '0.74rem' }}
              >
                Hide
              </button>
            </div>
            <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {course.title}
            </h3>
            <div className="course-progress-track" style={{ marginTop: '12px' }}>
              <div className="course-progress-fill" style={{ width: `${coursePct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{coursePct}% Completed</span>
              <span>{allLessons.length} Total Lessons</span>
            </div>
          </div>

          <div className="classroom-modules-list">
            {course.modules?.map((mod) => (
              <div key={mod.id} className="curriculum-module-card">
                <div style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {mod.title}
                </div>

                <div className="module-lessons-group">
                  {mod.lessons.map((lesson) => {
                    const globalIdx = allLessons.findIndex((l) => l.id === lesson.id);
                    const isActive = globalIdx === activeLessonIndex;
                    const done = isLessonCompleted(lesson.id);

                    return (
                      <button
                        type="button"
                        key={lesson.id}
                        className={`lesson-nav-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveLessonIndex(globalIdx)}
                      >
                        <div className={`lesson-check-icon ${done ? 'completed' : ''}`}>{done ? '✓' : ''}</div>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {lesson.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <Link to={`/quiz/${course.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              <Award size={14} /> Course Examination Quiz
            </Link>
          </div>
        </aside>
      )}

      <main className="classroom-stage">
        {!isAuthenticated && (
          <div
            style={{
              maxWidth: '960px',
              marginBottom: '14px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
              fontSize: '0.84rem'
            }}
          >
            <span>Previewing classroom syllabus as guest. Sign in to save completed lessons and earn certificates.</span>
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          </div>
        )}

        {!sidebarOpen && (
          <div style={{ marginBottom: '14px' }}>
            <button type="button" onClick={() => setSidebarOpen(true)} className="btn btn-outline btn-sm">
              <Menu size={14} /> Show Syllabus Drawer
            </button>
          </div>
        )}

        <div className="video-frame-container">
          <iframe
            src={currentLesson.videoUrl}
            title={currentLesson.title}
            className="video-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="stage-controls-bar">
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>{currentLesson.title}</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Lesson {activeLessonIndex + 1} of {allLessons.length} • Duration: {currentLesson.duration}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
              style={isCompleted ? { borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' } : undefined}
            >
              <CheckCircle2 size={15} /> {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>

            <button
              type="button"
              onClick={() => setActiveLessonIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeLessonIndex === 0}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <button
              type="button"
              onClick={() => setActiveLessonIndex((prev) => Math.min(allLessons.length - 1, prev + 1))}
              disabled={activeLessonIndex >= allLessons.length - 1}
              className="btn btn-outline btn-sm"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="lesson-tabs-nav">
          <button type="button" className={`lesson-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <BookOpen size={15} /> Lecture Notes
          </button>
          <button type="button" className={`lesson-tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
            <Download size={15} /> Resources ({Math.max(1, courseMaterials.length)})
          </button>
          <button type="button" className={`lesson-tab-btn ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
            <MessageSquare size={15} /> Academic Forum ({forumPosts.length})
          </button>
        </div>

        <div className="tab-pane-content">
          {activeTab === 'notes' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Lecture Summary &amp; Architecture Notes</h3>
              <p style={{ marginBottom: '16px' }}>
                In <strong>{currentLesson.title}</strong>, review core engineering abstractions and implementation patterns taught under{' '}
                <strong>{course.title}</strong> ({course.departmentName}).
              </p>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '15px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)'
                }}
              >
                {`const lessonRecord = {\n  course: "${course.title}",\n  moduleTopic: "${currentLesson.title}",\n  status: "${isCompleted ? 'Completed' : 'In Progress'}"\n};`}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Course Reference Materials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Lecture Handout — {currentLesson.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Markdown Study Summary</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadHandout(currentLesson.title, course.description)}
                    className="btn btn-outline btn-sm"
                  >
                    <Download size={13} /> Download Sheet
                  </button>
                </div>

                {courseMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: 'var(--accent-bronze)' }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{mat.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {mat.type} • {mat.summary}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadHandout(mat.title, mat.summary)}
                      className="btn btn-outline btn-sm"
                    >
                      <Download size={13} /> Download {mat.type}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Course Cohort Forum</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {forumPosts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '13px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.author}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.time}</span>
                    </div>
                    <p style={{ fontSize: '0.86rem' }}>{p.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddForumPost} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Post a technical question for cohort faculty..."
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Send size={14} /> Post
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
