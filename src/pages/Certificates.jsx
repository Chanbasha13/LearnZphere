import React, { useState } from 'react';
import { Award, Printer, ShieldCheck, GraduationCap } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { generateCertificateId, formatDate } from '../utils/helpers';

export default function Certificates() {
  const { user } = useAuth();
  const { courses, quizResults } = useCourses();

  const [selectedCourseId, setSelectedCourseId] = useState(1);

  const selectedCourse = courses.find((c) => Number(c.id) === Number(selectedCourseId)) || courses[0];
  const quizRecord = quizResults[selectedCourse?.id];
  const certId = generateCertificateId(selectedCourseId, user?.studentId || 'KL-2026');

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>Academic Credentials</span>
            <h1 className="welcome-title">Conferred Degree Certificates</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Official KL University digital credentials awarded upon passing examination requirements.
            </p>
          </div>

          <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={18} style={{ color: 'var(--accent-bronze)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Select Accredited Course:</span>
          </div>

          <select
            className="form-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            style={{ maxWidth: '340px' }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.departmentName})
              </option>
            ))}
          </select>
        </div>

        <div className="certificate-preview-wrapper">
          <div className="certificate-inner-frame">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(212, 168, 114, 0.14)',
                border: '2px solid #d4a872',
                color: '#d4a872',
                marginBottom: '14px'
              }}
            >
              <GraduationCap size={26} />
            </div>

            <div style={{ fontSize: '0.82rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1acbc', fontWeight: 700, marginBottom: '6px' }}>
              KL University • LearnSphere Academic Council
            </div>

            <div className="cert-title">Certificate of Academic Completion</div>

            <p style={{ fontSize: '0.94rem', color: '#a1acbc', fontStyle: 'italic', margin: '12px 0' }}>
              This certifies that upon recommendation of {selectedCourse?.departmentName || 'Faculty Council'},
            </p>

            <div className="cert-student-name">{user?.name || 'Scholar'}</div>

            <p style={{ fontSize: '0.96rem', color: '#d4dce6', maxWidth: '620px', margin: '0 auto 18px', lineHeight: '1.6' }}>
              has completed classroom modules, laboratory assessments, and examination standards for
            </p>

            <h3 style={{ fontSize: '1.5rem', color: '#d4a872', fontWeight: 800, marginBottom: '12px' }}>
              {selectedCourse?.title}
            </h3>

            {quizRecord && (
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2db08d', marginBottom: '18px' }}>
                Examination Result Verified: {quizRecord.percentage}% ({quizRecord.passed ? 'Distinction Pass' : 'Pending Pass'})
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '20px',
                paddingTop: '28px',
                borderTop: '1px solid rgba(212, 168, 114, 0.3)',
                marginTop: '28px',
                alignItems: 'flex-end',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: '#f2efe9', marginBottom: '4px' }}>
                  {selectedCourse?.instructor || 'Faculty Lead'}
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', width: '80%', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.75rem', color: '#a1acbc' }}>Course Faculty Lead</div>
              </div>

              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 13px',
                    borderRadius: '999px',
                    background: 'rgba(45, 176, 141, 0.14)',
                    border: '1px solid #2db08d',
                    color: '#2db08d',
                    fontSize: '0.76rem',
                    fontWeight: 700
                  }}
                >
                  <ShieldCheck size={14} /> Registrar Verified
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6c788a', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  ID: {certId}
                </div>
              </div>

              <div>
                <div style={{ fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: '#f2efe9', marginBottom: '4px' }}>
                  Dr. Elena Vance
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', width: '80%', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.75rem', color: '#a1acbc' }}>Dean of Academics</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#6c788a', marginTop: '22px' }}>
              Issued on {formatDate(new Date())} • Vaddeswaram Campus Academic Registrar
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
