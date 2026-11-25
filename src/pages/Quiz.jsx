import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/sound';

export default function Quiz() {
  const { id } = useParams();
  const { getCourseById, recordQuiz, getQuizForCourse } = useCourses();
  const { isAuthenticated } = useAuth();

  const course = getCourseById(id);
  const questions = getQuizForCourse(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const selectedAnswersRef = useRef({});
  selectedAnswersRef.current = selectedAnswers;
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (submitted) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!course) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Examination Not Found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, questions.length - 1));
  const currentQ = questions[safeIndex] || questions[0];

  const handleSelectOption = (optIdx) => {
    soundEngine.playClick(800);
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx
    }));
  };

  const handleSubmitExam = () => {
    const latestAnswers = selectedAnswersRef.current;
    let score = 0;
    questions.forEach((q, idx) => {
      if (latestAnswers[idx] === q.answer) {
        score += 1;
      }
    });

    const res = recordQuiz(course.id, score, questions.length);
    setResult(res);
    setSubmitted(true);

    if (res.passed) {
      soundEngine.playSuccess();
      try {
        confetti({ particleCount: 90, spread: 68, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
    }
  };

  const handleRetake = () => {
    soundEngine.playClick(600);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setResult(null);
    setTimeLeft(300);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - var(--navbar-height))', padding: '36px 20px 80px' }}>
      <div className="container">
        <div style={{ maxWidth: '760px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <Link to={`/classroom/${course.id}`} className="btn btn-outline btn-sm">
            ← Return to Classroom
          </Link>
          <span className="badge badge-cyan">{course.title} Examination</span>
        </div>

        {!isAuthenticated && (
          <div
            style={{
              maxWidth: '760px',
              margin: '0 auto 16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.84rem'
            }}
          >
            <span>Preview mode — sign in to save examination grades to your official academic record.</span>
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          </div>
        )}

        {!submitted ? (
          <div className="quiz-card-container">
            <div className="quiz-header-bar">
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {Object.keys(selectedAnswers).length} Answered
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 13px',
                  background: timeLeft < 60 ? 'rgba(190, 18, 60, 0.12)' : 'var(--bg-secondary)',
                  color: timeLeft < 60 ? 'var(--accent-rose)' : 'var(--text-primary)',
                  borderRadius: '999px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Clock size={15} /> {formatTime(timeLeft)}
              </div>
            </div>

            <div className="quiz-progress-palette">
              {questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurr = idx === currentIndex;
                return (
                  <button
                    type="button"
                    key={idx}
                    className={`palette-dot ${isCurr ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <h2 className="quiz-question-text">{currentQ.question}</h2>

            <div className="quiz-options-list">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                return (
                  <button
                    type="button"
                    key={optIdx}
                    className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(optIdx)}
                  >
                    <span>{option}</span>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        color: isSelected ? '#ffffff' : 'inherit'
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="btn btn-primary btn-sm"
                >
                  Next Question <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#ffffff' }}
                >
                  Submit Examination <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="quiz-card-container">
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  background: result?.passed ? 'rgba(15, 118, 110, 0.12)' : 'rgba(190, 18, 60, 0.12)',
                  color: result?.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                {result?.passed ? <Award size={32} /> : <XCircle size={32} />}
              </div>

              <div>
                <span className={`badge ${result?.passed ? 'badge-emerald' : 'badge-rose'}`} style={{ marginBottom: '8px' }}>
                  {result?.passed ? 'Academic Certification Granted' : 'Retake Required (Threshold: 60%)'}
                </span>
              </div>

              <h1 style={{ fontSize: '2.05rem', margin: '8px 0' }}>
                {result?.score} / {result?.total} Correct ({result?.percentage}%)
              </h1>

              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
                {result?.passed
                  ? 'You have satisfied the examination threshold for this curriculum track.'
                  : 'Review the explanations below and retake when ready.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '22px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleRetake} className="btn btn-outline btn-sm">
                  <RotateCcw size={14} /> Retake Examination
                </button>
                {result?.passed && isAuthenticated && (
                  <Link to="/certificates" className="btn btn-primary btn-sm">
                    <Award size={14} /> View Official Degree Certificate
                  </Link>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Question Review</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {questions.map((q, idx) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.answer;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${isCorrect ? 'rgba(15, 118, 110, 0.35)' : 'rgba(190, 18, 60, 0.35)'}`,
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.93rem' }}>
                          Q{idx + 1}: {q.question}
                        </span>
                        <span style={{ color: isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', marginBottom: '8px' }}>
                        <div>
                          <strong>Your Answer:</strong> {userAns !== undefined ? q.options[userAns] : 'Not Answered'}
                        </div>
                        {!isCorrect && (
                          <div style={{ color: 'var(--accent-emerald)' }}>
                            <strong>Correct Answer:</strong> {q.options[q.answer]}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '9px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--accent-cyan)' }}>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
