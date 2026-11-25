import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Clock, Star, ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../data/departmentsData';

export default function Courses() {
  const { courses, isEnrolled, enroll } = useCourses();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialDept = searchParams.get('department') || 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const dept = searchParams.get('department');
    if (dept) setSelectedDept(dept);
    else setSelectedDept('all');
  }, [searchParams]);

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    if (deptId === 'all') {
      searchParams.delete('department');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ department: deptId });
    }
  };

  const handleQuickEnroll = (courseId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    enroll(courseId);
  };

  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'all' || course.departmentId === selectedDept;
      const matchesDiff = difficultyFilter === 'All' || course.difficulty === difficultyFilter;
      return matchesSearch && matchesDept && matchesDiff;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'lessons') return (b.lessonsCount || 0) - (a.lessonsCount || 0);
      return Number(a.id) - Number(b.id);
    });

  return (
    <div style={{ padding: '44px 0 80px', minHeight: 'calc(100vh - var(--navbar-height))', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <span className="badge badge-bronze" style={{ marginBottom: '10px' }}>Academic Curriculum</span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.55rem)', marginBottom: '8px' }}>
            KL University Accredited Course Catalog
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '720px' }}>
            Filter by academic department or level, inspect syllabus modules, and enroll directly into digital classrooms.
          </p>
        </div>

        {/* Filter Controls Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px 20px',
            marginBottom: '26px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search courses, faculty instructors, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search course catalog"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '145px' }}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '165px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="popular">Catalog Order</option>
              <option value="rating">Highest Rated</option>
              <option value="lessons">Most Lessons</option>
            </select>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <button
            type="button"
            onClick={() => handleDeptChange('all')}
            className={`btn btn-sm ${selectedDept === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All Faculties ({courses.length})
          </button>
          {DEPARTMENTS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDeptChange(d.id)}
              className={`btn btn-sm ${selectedDept === d.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '8px' }}>No matching courses found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Adjust your search keyword or department selection.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('All');
                handleDeptChange('all');
              }}
              className="btn btn-primary btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="courses-grid-3d">
            {filteredCourses.map((course) => {
              const enrolled = isEnrolled(course.id);

              return (
                <div key={course.id} className="course-card-3d">
                  <div className="course-card-banner">
                    <img src={course.image} alt={course.title} className="course-card-img" />
                    <span className="badge badge-cyan" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {course.difficulty}
                    </span>
                    {enrolled && (
                      <span className="badge badge-emerald" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <CheckCircle2 size={12} /> Enrolled
                      </span>
                    )}
                  </div>

                  <div className="course-card-content">
                    <div className="course-card-dept">{course.departmentName}</div>
                    <h2 className="course-card-title">{course.title}</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.55' }}>
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
                        gap: '8px',
                        paddingTop: '14px',
                        marginTop: 'auto',
                        borderTop: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {course.instructor}
                      </span>

                      <div style={{ display: 'flex', gap: '7px' }}>
                        <Link to={`/course/${course.id}`} className="btn btn-outline btn-sm">
                          Details
                        </Link>
                        {enrolled ? (
                          <Link to={`/classroom/${course.id}`} className="btn btn-primary btn-sm">
                            <Play size={13} /> Class
                          </Link>
                        ) : (
                          <button type="button" onClick={() => handleQuickEnroll(course.id)} className="btn btn-primary btn-sm">
                            Enroll <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
