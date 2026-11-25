import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Award,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Users,
  GraduationCap,
  FileText
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getCourseById, isEnrolled, enroll, materials } = useCourses();
  const { isAuthenticated } = useAuth();

  const course = getCourseById(id);
  const enrolled = isEnrolled(id);
  const courseMaterials = materials.filter((m) => Number(m.courseId) === Number(id));

  const [openModuleId, setOpenModuleId] = useState('mod-1');

  if (!course) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
          The requested course record does not exist or has been archived.
        </p>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Course Catalog
        </Link>
      </div>
    );
  }

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!enrolled) {
      enroll(course.id);
    }
    navigate(`/classroom/${course.id}`);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))', paddingBottom: '80px' }}>
      {/* Course Hero Banner (Theme-Adaptive) */}
      <section
        style={{
          background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '48px 0 42px'
        }}
      >
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan">{course.departmentName}</span>
                <span className="badge badge-bronze">{course.difficulty}</span>
                {enrolled && <span className="badge badge-emerald">Enrolled</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.6rem)', marginBottom: '14px', lineHeight: '1.18' }}>
                {course.title}
              </h1>

              <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: '1.65' }}>
                {course.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '26px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
                  <strong>{course.rating}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>({course.reviewsCount || 120} reviews)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span>{course.duration}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} style={{ color: 'var(--accent-emerald)' }} />
                  <span>{course.lessonsCount || 8} Lessons</span>
                </div>

                {courseMaterials.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} style={{ color: 'var(--accent-bronze)' }} />
                    <span>{courseMaterials.length} Study Handouts</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleEnrollClick} className="btn btn-primary btn-lg">
                  {enrolled ? (
                    <>
                      <Play size={18} /> Continue in Classroom
                    </>
                  ) : (
                    <>
                      <GraduationCap size={18} /> {isAuthenticated ? 'Enroll & Open Classroom' : 'Sign In to Enroll'}
                    </>
                  )}
                </button>

                <Link to={`/quiz/${course.id}`} className="btn btn-outline btn-lg">
                  <Award size={18} /> Take Examination
                </Link>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <img
                src={course.image}
                alt={course.title}
                style={{ width: '100%', maxWidth: '320px', aspectRatio: '5 / 3', objectFit: 'cover', borderRadius: '10px', margin: '0 auto 18px', display: 'block' }}
              />
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '15px',
                  textAlign: 'left',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                  Faculty Lead
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.instructor}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {course.instructorRole || 'KL University Faculty'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details Columns */}
      <section style={{ paddingTop: '44px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            <div>
              <div className="glass-panel" style={{ padding: '26px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Learning Outcomes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {course.whatYouWillLearn?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={17} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '26px' }}>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.3rem' }}>Curriculum Syllabus</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {course.modules?.length || 1} Modules • {course.lessonsCount || 5} Structured Lectures
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {course.modules?.map((mod) => {
                    const isOpen = openModuleId === mod.id;
                    return (
                      <div key={mod.id} className="curriculum-module-card">
                        <button
                          type="button"
                          className="module-header-btn"
                          onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                        >
                          <span>{mod.title}</span>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {isOpen && (
                          <div className="module-lessons-group">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderBottom: '1px solid var(--border-subtle)',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Play size={14} style={{ color: 'var(--accent-cyan)' }} />
                                  <span>{lesson.title}</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.12rem', marginBottom: '12px' }}>Prerequisites</h3>
                <ul style={{ paddingLeft: '18px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {course.prerequisites?.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(154, 91, 37, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-bronze)',
                    marginBottom: '12px'
                  }}
                >
                  <Award size={20} />
                </div>
                <h3 style={{ fontSize: '1.12rem', marginBottom: '8px' }}>Accredited Degree Credential</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                  Complete classroom lectures and score at least 60% in the faculty examination to generate a verifiable university certificate.
                </p>
                <Link to={`/quiz/${course.id}`} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  Open Course Examination
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
