import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  X,
  MessageSquare,
  Award,
  Search
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useCourses } from '../context/CourseContext';
import { formatDate } from '../utils/helpers';

export default function Assignments() {
  const { assignments, submitAssign } = useCourses();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeAssign, setActiveAssign] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = assignments.filter((a) => {
    const matchesStatus = filter === 'all' || a.status.toLowerCase() === filter;
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenModal = (assign) => {
    setActiveAssign(assign);
    setSubmissionText(assign.submissionText || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submissionText.trim() || !activeAssign) return;

    submitAssign(activeAssign.id, submissionText.trim());
    setSuccessMsg(`Submission recorded for "${activeAssign.title}". Faculty can now review & grade it.`);
    setActiveAssign(null);
    setSubmissionText('');

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <span className="badge badge-bronze" style={{ marginBottom: '6px' }}>Coursework Portal</span>
            <h1 className="welcome-title">Assignments &amp; Lab Evaluations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Upload project deliverables, track grading status, and inspect faculty rubric remarks.
            </p>
          </div>
        </div>

        {successMsg && (
          <div
            role="status"
            style={{
              padding: '12px 16px',
              background: 'rgba(15, 118, 110, 0.1)',
              border: '1px solid rgba(15, 118, 110, 0.35)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-emerald)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={17} /> {successMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'submitted', 'graded'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setFilter(t)}
                className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem', paddingBlock: '7px' }}
              placeholder="Search deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No assignments match the active filter.
            </div>
          ) : (
            filtered.map((assign) => {
              const isOverdue = assign.status === 'Pending' && new Date(assign.dueDate) < new Date('2026-11-26');
              return (
                <div key={assign.id} className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span
                          className={`badge ${
                            assign.status === 'Graded'
                              ? 'badge-emerald'
                              : assign.status === 'Submitted'
                              ? 'badge-cyan'
                              : isOverdue
                              ? 'badge-rose'
                              : 'badge-amber'
                          }`}
                        >
                          {assign.status === 'Pending' && isOverdue ? 'Due Immediately' : assign.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{assign.course}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Due: {formatDate(assign.dueDate)} • {assign.points} pts
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.14rem', marginBottom: '6px' }}>{assign.title}</h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '10px' }}>
                        {assign.description}
                      </p>

                      {assign.instructions && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                          <strong>Submission Guideline:</strong> {assign.instructions}
                        </div>
                      )}

                      {assign.feedback && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '12px',
                            background: 'rgba(15, 118, 110, 0.08)',
                            border: '1px solid rgba(15, 118, 110, 0.25)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '3px' }}>
                            <MessageSquare size={14} /> Faculty Evaluation ({assign.grade} / {assign.points})
                          </div>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{assign.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {assign.grade !== null && (
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Award size={19} /> {assign.grade}/{assign.points}
                        </div>
                      )}

                      {assign.status === 'Pending' ? (
                        <button type="button" onClick={() => handleOpenModal(assign)} className="btn btn-primary btn-sm">
                          <Send size={14} /> Submit Deliverable
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleOpenModal(assign)} className="btn btn-outline btn-sm">
                          <FileText size={14} /> {assign.status === 'Graded' ? 'View Submission' : 'Update Submission'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activeAssign && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{activeAssign.course}</span>
                  <h2 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{activeAssign.title}</h2>
                </div>
                <button type="button" onClick={() => setActiveAssign(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Repository Link or Technical Writeup</label>
                  <textarea
                    rows="5"
                    className="form-textarea"
                    placeholder="Paste GitHub URL, architecture summary, or lab notes..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    disabled={activeAssign.status === 'Graded'}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setActiveAssign(null)} className="btn btn-outline btn-sm">Close</button>
                  {activeAssign.status !== 'Graded' && (
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Send size={14} /> Submit to Faculty
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
