import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Award,
  ArrowRight,
  Clock,
  Star,
  MapPin,
  ShieldCheck,
  GraduationCap,
  Building2,
  CheckCircle2,
  UserPlus,
  LogIn,
  ChevronDown,
  Layers,
  FileText
} from 'lucide-react';
import Campus3DScene from '../scenes/Campus3DScene';
import DepthCard from '../components/DepthCard';
import { DEPARTMENTS } from '../data/departmentsData';
import { KLU_BUILDINGS } from '../data/kluCampusData';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';

const FEATURED_PRECINCTS = [
  {
    id: 'central-library',
    code: 'L-BLK',
    title: 'Central Library & Reading Atrium',
    subtitle: 'Three-Story Daylight Stack Commons',
    metric: '49m × 69m Footprint',
    description:
      'Anchored west of Arts Block with signature warm timber soffit entrance canopy, curated print archives, and digital research suites.'
  },
  {
    id: 'c-block',
    code: 'C-BLK',
    title: 'Computer Science & FED Spine',
    subtitle: 'Six-Story Engineering & Programming Core',
    metric: 'Multi-Wing Studios',
    description:
      'Houses software engineering studios, systems architecture labs, Jasmine Hall seminar rooms, and freshman engineering classrooms.'
  },
  {
    id: 'rnd-block',
    code: 'R&D',
    title: 'Research & Innovation Tower',
    subtitle: 'Applied Laboratories & Project Colloquia',
    metric: 'High-bay Research Wing',
    description:
      'Center for systems prototyping, instrumentation cohorts, and faculty-guided honors capstone evaluation.'
  },
  {
    id: 'sdc-block',
    code: 'SDC / S',
    title: 'Skill Development & Business Tower',
    subtitle: 'LEED Solar-Capped Circular-End Wing',
    metric: 'Placement & Strategy Hub',
    description:
      'Unites KL Business School case rooms with full-stack placement readiness halls near Aravali & Vindhya residential blocks.'
  }
];

export default function Home() {
  const { isAuthenticated, role, user, allUsers } = useAuth();
  const { courses, materials, announcements } = useCourses();
  const [searchParams, setSearchParams] = useSearchParams();

  const hasCampusParam = Boolean(
    searchParams.get('building') || searchParams.get('mode') || searchParams.get('preset')
  );

  const [campusExpanded, setCampusExpanded] = useState(hasCampusParam);
  const [isClosingCampus, setIsClosingCampus] = useState(false);
  const [courseFilterDept, setCourseFilterDept] = useState('all');
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (hasCampusParam) {
      setCampusExpanded(true);
      setIsClosingCampus(false);
    }
  }, [hasCampusParam]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  // Scroll-reveal depth animation observer
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;
    const els = document.querySelectorAll('.ls-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleOpenCampus = (buildingId = null) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosingCampus(false);
    if (buildingId) {
      setSearchParams({ building: buildingId });
    }
    setCampusExpanded(true);
  };

  const handleCloseCampus = () => {
    setIsClosingCampus(true);
    closeTimerRef.current = setTimeout(() => {
      setCampusExpanded(false);
      setIsClosingCampus(false);
      if (hasCampusParam) {
        setSearchParams({});
      }
    }, 240);
  };

  const dashboardPath =
    role === 'admin'
      ? '/admin-dashboard'
      : role === 'instructor'
      ? '/instructor-dashboard'
      : '/student-dashboard';

  const visibleCourses = useMemo(() => {
    if (courseFilterDept === 'all') return courses.slice(0, 6);
    return courses.filter((c) => c.departmentId === courseFilterDept).slice(0, 6);
  }, [courses, courseFilterDept]);

  // Unique real faculty directory derived directly from course catalog
  const facultyLeads = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (c.instructor && !map.has(c.instructor)) {
        map.set(c.instructor, {
          name: c.instructor,
          role: c.instructorRole || 'KL University Faculty',
          department: c.departmentName,
          courseCount: 1
        });
      } else if (c.instructor && map.has(c.instructor)) {
        map.get(c.instructor).courseCount += 1;
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [courses]);

  const studentsCount = allUsers.filter((u) => u.role === 'student').length;
  const facultyCount = allUsers.filter((u) => u.role === 'instructor').length;

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* BAND 1: FULL-SCREEN KLU 360° DIGITAL TWIN HERO */}
      <section className="ls-cinematic-hero" aria-label="KL University Digital Campus Hero">
        {/* Live Full-Screen 3D Campus Canvas (Single WebGL Instance) */}
        <div className="ls-hero-campus-backdrop">
          <Campus3DScene
            isExpanded={campusExpanded}
            isClosing={isClosingCampus}
            onRequestOpen={() => handleOpenCampus()}
            onRequestClose={handleCloseCampus}
          />
        </div>

        {/* Atmospheric Editorial Edge Vignette */}
        {!campusExpanded && <div className="ls-hero-vignette" aria-hidden="true" />}

        {/* Floating Architectural Foreground Composition */}
        {!campusExpanded && (
          <div className="container ls-hero-foreground">
            {/* Top-left Institutional Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(16, 21, 32, 0.78)',
                  border: '1px solid rgba(212, 168, 114, 0.32)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-bronze)'
                }}
              >
                <Building2 size={13} /> KL University (KLEF) • Vaddeswaram 3D Twin
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'rgba(16, 21, 32, 0.72)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: '0.73rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span>Live WebGL • Drag Hero Skyline or Enter Interactive Tour</span>
              </div>
            </div>

            {/* Center Editorial Headline & Action Controls */}
            <div style={{ maxWidth: '670px', margin: '36px 0' }}>
              <h1
                className="ls-display-heading"
                style={{
                  fontSize: 'clamp(2.75rem, 5.4vw, 4.4rem)',
                  color: 'var(--text-primary)',
                  marginBottom: '18px'
                }}
              >
                Accredited University Scholarship, Anchored in Real Campus Architecture.
              </h1>

              <p
                style={{
                  fontSize: 'clamp(0.98rem, 1.3vw, 1.12rem)',
                  color: 'var(--text-secondary)',
                  maxWidth: '540px',
                  lineHeight: '1.68',
                  marginBottom: '28px'
                }}
              >
                Navigate all {KLU_BUILDINGS.length} surveyed structures of KL University Vaddeswaram in real time, then step directly inside faculty-led degree curricula, laboratory submissions, and examinations.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  data-magnetic="true"
                  data-cursor-label="EXPLORE"
                  onClick={() => handleOpenCampus()}
                  className="btn btn-primary btn-lg"
                >
                  <Compass size={18} /> Explore 3D Campus
                </button>

                {isAuthenticated ? (
                  <Link
                    to={dashboardPath}
                    data-magnetic="true"
                    data-cursor-label="PORTAL"
                    className="btn btn-outline btn-lg"
                    style={{ background: 'rgba(16, 21, 32, 0.72)' }}
                  >
                    Open {role === 'admin' ? 'Admin' : role === 'instructor' ? 'Faculty' : 'Student'} Workspace <ArrowRight size={17} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      data-magnetic="true"
                      data-cursor-label="SIGN IN"
                      className="btn btn-outline btn-lg"
                      style={{ background: 'rgba(16, 21, 32, 0.72)' }}
                    >
                      <LogIn size={17} /> Sign In
                    </Link>
                    <Link to="/courses" className="btn btn-secondary btn-lg">
                      <BookOpen size={17} /> Course Catalog
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Live Telemetry Strip + Centered Scroll Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {KLU_BUILDINGS.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Campus Buildings
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {DEPARTMENTS.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Academic Faculties
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {courses.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Degree Modules
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="ls-scroll-indicator"
                onClick={() => document.getElementById('university-intro')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Scroll to university ecosystem sections"
              >
                <span>Scroll to Explore</span>
                <span className="ls-scroll-line" />
                <ChevronDown size={14} style={{ color: 'var(--accent-bronze)' }} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* BAND 2: UNIVERSITY INTRODUCTION & VERIFIED METRICS */}
      <section
        id="university-intro"
        style={{
          padding: '84px 0',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="container ls-reveal">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '40px',
              alignItems: 'center'
            }}
          >
            <div>
              <span className="badge badge-bronze" style={{ marginBottom: '12px' }}>
                Spatial Digital University
              </span>
              <h2 className="ls-display-heading" style={{ fontSize: 'clamp(2.1rem, 3.6vw, 3rem)', marginBottom: '16px' }}>
                Bridging Physical Architecture with Accredited Digital Study
              </h2>
              <p style={{ fontSize: '0.98rem', lineHeight: '1.7', marginBottom: '18px' }}>
                Rather than separating coursework from the university grounds, LearnSphere anchors each academic faculty inside its surveyed building block in Vaddeswaram — connecting C Block computing labs, Central Library L-Block reading rooms, SKC AI centers, and SDC executive suites directly to live syllabi.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/courses" className="btn btn-primary btn-sm" data-magnetic="true">
                  Browse Curriculum ({courses.length}) <ArrowRight size={14} />
                </Link>
                {!isAuthenticated && (
                  <Link to="/signup" className="btn btn-outline btn-sm">
                    <UserPlus size={14} /> Create Scholar Account
                  </Link>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
              <DepthCard className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)', textTransform: 'uppercase' }}>
                  Geospatial Footprint
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 4px' }}>{KLU_BUILDINGS.length}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Surveyed Vaddeswaram structures</div>
              </DepthCard>

              <DepthCard className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)', textTransform: 'uppercase' }}>
                  Active Curriculum
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 4px' }}>{courses.length}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Degree courses &amp; timed exams</div>
              </DepthCard>

              <DepthCard className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)', textTransform: 'uppercase' }}>
                  Campus Directory
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 4px' }}>{studentsCount + facultyCount}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Active registered scholars &amp; faculty</div>
              </DepthCard>

              <DepthCard className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)', textTransform: 'uppercase' }}>
                  Reference Bank
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 4px' }}>{materials.length}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Faculty slides &amp; downloadable handouts</div>
              </DepthCard>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: ICONIC CAMPUS FACILITIES PRECINCTS */}
      <section style={{ padding: '84px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container ls-reveal">
          <div className="section-title-row" style={{ marginBottom: '32px' }}>
            <div>
              <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Campus Landmarks</span>
              <h2 className="ls-display-heading" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.65rem)' }}>
                Architectural Precincts of Vaddeswaram
              </h2>
              <p style={{ fontSize: '0.95rem', marginTop: '4px' }}>
                Select any campus facility to fly directly to its model inside the interactive 3D digital twin.
              </p>
            </div>
            <button type="button" onClick={() => handleOpenCampus()} className="btn btn-outline btn-sm">
              <Compass size={15} /> Open Full 3D Map
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {FEATURED_PRECINCTS.map((p) => (
              <DepthCard
                key={p.id}
                className="glass-panel"
                cursorLabel="FLY 3D"
                style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--accent-bronze)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {p.code}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {p.metric}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.16rem', marginBottom: '3px' }}>{p.title}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{p.subtitle}</div>
                </div>

                <p style={{ fontSize: '0.86rem', lineHeight: '1.6', flex: 1 }}>{p.description}</p>

                <button
                  type="button"
                  onClick={() => handleOpenCampus(p.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Inspect {p.code} in 3D <ArrowRight size={14} />
                </button>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      {/* BAND 4: ACADEMIC FACULTIES & DEPARTMENTS */}
      <section style={{ padding: '84px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container ls-reveal">
          <div className="section-title-row" style={{ marginBottom: '32px' }}>
            <div>
              <span className="badge badge-bronze" style={{ marginBottom: '8px' }}>Academic Schools</span>
              <h2 className="ls-display-heading" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.65rem)' }}>
                Faculties &amp; Research Divisions
              </h2>
            </div>
            <Link to="/courses" className="btn btn-outline btn-sm">
              Full Catalog <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
            {DEPARTMENTS.map((dept) => (
              <DepthCard
                key={dept.id}
                className="glass-panel"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-bronze">{dept.code}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {dept.buildingName}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.14rem', marginBottom: '4px' }}>{dept.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{dept.dean}</div>
                </div>

                <p style={{ fontSize: '0.85rem', lineHeight: '1.58', flex: 1 }}>{dept.tagline}</p>

                <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenCampus(dept.kluBuildingId)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Compass size={14} /> Locate 3D
                  </button>
                  <Link to={`/courses?department=${dept.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <BookOpen size={14} /> Syllabus
                  </Link>
                </div>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      {/* BAND 5: COURSE DISCOVERY WITH LIVE DEPARTMENT TABS */}
      <section style={{ padding: '84px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container ls-reveal">
          <div className="section-title-row" style={{ marginBottom: '20px' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>Course Discovery</span>
              <h2 className="ls-display-heading" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.65rem)' }}>
                Accredited University Courses
              </h2>
            </div>
            <Link to="/courses" className="btn btn-primary btn-sm" data-magnetic="true">
              Explore All {courses.length} Courses <ArrowRight size={14} />
            </Link>
          </div>

          {/* Interactive Department Filter Strip */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setCourseFilterDept('all')}
              className={`btn btn-sm ${courseFilterDept === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All Tracks
            </button>
            {DEPARTMENTS.slice(0, 4).map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => setCourseFilterDept(d.id)}
                className={`btn btn-sm ${courseFilterDept === d.id ? 'btn-primary' : 'btn-outline'}`}
              >
                {d.name}
              </button>
            ))}
          </div>

          <div className="courses-grid-3d" style={{ marginBottom: 0 }}>
            {visibleCourses.map((course) => (
              <DepthCard key={course.id} className="course-card-3d" cursorLabel="INSPECT">
                <div className="course-card-banner">
                  <img src={course.image} alt={course.title} className="course-card-img" />
                  <span className="badge" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {course.difficulty}
                  </span>
                </div>

                <div className="course-card-content">
                  <div className="course-card-dept">{course.departmentName}</div>
                  <h3 className="course-card-title">{course.title}</h3>
                  <p style={{ fontSize: '0.84rem', marginBottom: '14px', lineHeight: '1.58' }}>
                    {course.description?.slice(0, 118)}...
                  </p>

                  <div className="course-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {course.duration}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      <Star size={13} style={{ fill: 'var(--accent-amber)' }} /> {course.rating}
                    </span>
                    <span>{course.lessonsCount} Lessons</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      marginTop: 'auto',
                      borderTop: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {course.instructor}
                    </span>
                    <Link to={`/course/${course.id}`} className="btn btn-primary btn-sm">
                      Inspect <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      {/* BAND 6: SPATIAL LEARNING EXPERIENCE WORKFLOW */}
      <section style={{ padding: '84px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container ls-reveal">
          <div style={{ maxWidth: '640px', marginBottom: '36px' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>Learning Architecture</span>
            <h2 className="ls-display-heading" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.65rem)' }}>
              Four Integrated Pillars of Study
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {[
              {
                num: '01',
                title: '3D Campus Context',
                body: 'Navigate academic blocks, read verified architectural survey facts, and open department syllabi straight from buildings.',
                icon: <Compass size={20} />
              },
              {
                num: '02',
                title: 'Structured Classroom',
                body: 'Track per-lesson mastery, download markdown lecture handouts, and collaborate in persistent cohort forums.',
                icon: <Layers size={20} />
              },
              {
                num: '03',
                title: 'Faculty Grading Studio',
                body: 'Submit assignments for faculty evaluation with numeric rubric grades, written feedback, and live cohort notifications.',
                icon: <FileText size={20} />
              },
              {
                num: '04',
                title: 'Verified Credentials',
                body: 'Complete timed module examinations above the 60% certification bar to generate printable registrar certificates.',
                icon: <Award size={20} />
              }
            ].map((step) => (
              <div key={step.num} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                    {step.num}
                  </span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{step.icon}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BAND 7: FACULTY & INSTITUTIONAL RESOURCES */}
      <section style={{ padding: '84px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container ls-reveal">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              alignItems: 'start'
            }}
          >
            <div>
              <span className="badge badge-bronze" style={{ marginBottom: '10px' }}>Faculty &amp; Academic Council</span>
              <h2 className="ls-display-heading" style={{ fontSize: 'clamp(1.85rem, 3vw, 2.5rem)', marginBottom: '12px' }}>
                Guided by Department Chairs &amp; Architects
              </h2>
              <p style={{ fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '20px' }}>
                Every curriculum track is authored by domain instructors who also manage quizzes, study resources ({materials.length} live documents), and cohort notices ({announcements.length} active notices).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {facultyLeads.map((f) => (
                  <div
                    key={f.name}
                    className="glass-panel"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {f.role} • {f.department}
                      </div>
                    </div>
                    <span className="badge badge-cyan">{f.courseCount} Track{f.courseCount > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <DepthCard className="glass-panel" style={{ padding: '32px', borderTop: '3px solid var(--accent-bronze)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <GraduationCap size={22} style={{ color: 'var(--accent-bronze)' }} />
                <span className="badge badge-emerald">Admissions &amp; Role Portals</span>
              </div>

              <h3 className="ls-display-heading" style={{ fontSize: '1.85rem', marginBottom: '10px' }}>
                {isAuthenticated ? `Signed in as ${user?.name}` : 'Enter Your University Workspace'}
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '24px' }}>
                {isAuthenticated
                  ? 'Access your role-specific dashboard to manage enrollments, coursework evaluations, quiz banks, or institutional analytics.'
                  : 'Create a new student or faculty account, or sign in via the portal to unlock coursework tracking, grading workflows, and registrar certificates.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isAuthenticated ? (
                  <Link to={dashboardPath} className="btn btn-primary btn-lg" data-magnetic="true">
                    Enter {role === 'admin' ? 'Admin Governance' : role === 'instructor' ? 'Faculty Studio' : 'Student Portal'} <ArrowRight size={17} />
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic="true">
                      <UserPlus size={17} /> Create University Account
                    </Link>
                    <Link to="/login" className="btn btn-outline btn-lg" data-magnetic="true">
                      <LogIn size={17} /> Sign In to Existing Account
                    </Link>
                  </>
                )}
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)'
                }}
              >
                <ShieldCheck size={15} style={{ color: 'var(--accent-emerald)' }} />
                <span>Persistent role-based sessions across Student, Instructor, and Admin tiers</span>
              </div>
            </DepthCard>
          </div>
        </div>
      </section>
    </div>
  );
}
