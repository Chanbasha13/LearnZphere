// LearnSphere — LocalStorage Persistence Engine
// Handles users, authentication (logged-out by default), per-student progress,
// courses, materials, quizzes, assignments, announcements, notifications, and activity logs.

import { coursesData } from '../data/coursesData';
import { assignmentsData } from '../data/assignmentsData';
import { quizData } from '../data/quizData';

export const KEYS = {
  CURRENT_USER: 'learnSphere_currentUser',
  USERS_DB: 'learnSphere_usersDB',
  ENROLLED_COURSES: 'learnSphere_enrolled',
  COURSE_PROGRESS: 'learnSphere_progress',
  COMPLETED_LESSONS: 'learnSphere_completedLessons',
  QUIZ_RESULTS: 'learnSphere_quizResults',
  STUDENT_STATES: 'learnSphere_studentStates',
  ASSIGNMENTS: 'learnSphere_assignments',
  ACHIEVEMENTS: 'learnSphere_achievements',
  CUSTOM_COURSES: 'learnSphere_customCourses',
  COURSE_OVERRIDES: 'learnSphere_courseOverrides',
  ANNOUNCEMENTS: 'learnSphere_announcements',
  COURSE_MATERIALS: 'learnSphere_materials',
  CUSTOM_QUIZZES: 'learnSphere_customQuizzes',
  ACTIVITY_LOG: 'learnSphere_activityLog',
  NOTIFICATIONS: 'learnSphere_notifications',
  THEME: 'learnSphere_theme',
  CAMPUS_AUDIO: 'learnSphere_campusAudio'
};

const makeAvatarSvg = (initials, bg = '#16324F', fg = '#FFFFFF') => {
  const safe = String(initials || 'LS').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const generateAvatar = (name, role = 'student') => {
  const parts = String(name || 'User').trim().split(/\s+/);
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  const palette =
    role === 'admin'
      ? ['#9A5B25', '#FFFFFF']
      : role === 'instructor'
      ? ['#214E4B', '#FFFFFF']
      : ['#16324F', '#FFFFFF'];
  return makeAvatarSvg(initials, palette[0], palette[1]);
};

export const DEFAULT_USERS = [
  {
    id: 'std_1',
    name: 'Alex Morgan',
    email: 'student@learnsphere.edu',
    password: 'password123',
    role: 'student',
    department: 'Computer Science & Engineering',
    headline: 'Undergraduate Honors Scholar • C Block Cohort',
    avatar: makeAvatarSvg('AM', '#16324F', '#FFFFFF'),
    streak: 5,
    studyHours: 42.5,
    studentId: 'KL-2026-0842',
    joinedDate: '2026-08-18'
  },
  {
    id: 'std_2',
    name: 'Rohan Verma',
    email: 'rohan@klu.edu',
    password: 'password123',
    role: 'student',
    department: 'Artificial Intelligence & Knowledge Systems',
    headline: 'B.Tech AI & Data Science • SKC Research Track',
    avatar: makeAvatarSvg('RV', '#16324F', '#FFFFFF'),
    streak: 7,
    studyHours: 51.0,
    studentId: 'KL-2026-0914',
    joinedDate: '2026-08-20'
  },
  {
    id: 'std_3',
    name: 'Ananya Iyer',
    email: 'ananya@klu.edu',
    password: 'password123',
    role: 'student',
    department: 'Computer Science & Engineering',
    headline: 'Full-Stack & Systems Scholar • C Block Cohort',
    avatar: makeAvatarSvg('AI', '#16324F', '#FFFFFF'),
    streak: 4,
    studyHours: 36.0,
    studentId: 'KL-2026-1029',
    joinedDate: '2026-09-02'
  },
  {
    id: 'inst_1',
    name: 'Dr. Sarah Johnson',
    email: 'instructor@learnsphere.edu',
    password: 'password123',
    role: 'instructor',
    department: 'Computer Science & Engineering',
    headline: 'Principal Systems & Web Architect • C Block Faculty Lead',
    avatar: makeAvatarSvg('SJ', '#214E4B', '#FFFFFF'),
    studentId: 'KL-FAC-0104',
    joinedDate: '2024-06-12'
  },
  {
    id: 'adm_1',
    name: 'Dr. Elena Vance',
    email: 'admin@learnsphere.edu',
    password: 'password123',
    role: 'admin',
    department: 'University Academic Senate',
    headline: 'Dean of Digital Infrastructure • Vaddeswaram Campus',
    avatar: makeAvatarSvg('EV', '#9A5B25', '#FFFFFF'),
    studentId: 'KL-ADM-0001',
    joinedDate: '2023-01-10'
  }
];

const INITIAL_STUDENT_STATES = {
  std_1: {
    enrolled: [1, 2, 4],
    progress: { 1: 44, 2: 20, 4: 80 },
    completedLessons: ['1-1', '1-2', '1-3', '1-4', '2-1', '4-1', '4-2', '4-3'],
    quizResults: {
      4: {
        score: 4,
        total: 5,
        percentage: 80,
        passed: true,
        date: '2026-11-12T10:15:00.000Z'
      }
    }
  },
  std_2: {
    enrolled: [2, 5],
    progress: { 2: 80, 5: 60 },
    completedLessons: ['2-1', '2-2', '2-3', '2-4', '5-1', '5-2'],
    quizResults: {
      2: {
        score: 5,
        total: 5,
        percentage: 100,
        passed: true,
        date: '2026-11-15T14:20:00.000Z'
      }
    }
  },
  std_3: {
    enrolled: [1, 3],
    progress: { 1: 67, 3: 40 },
    completedLessons: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '3-1'],
    quizResults: {
      1: {
        score: 4,
        total: 5,
        percentage: 80,
        passed: true,
        date: '2026-11-18T09:30:00.000Z'
      }
    }
  }
};

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann_1',
    courseId: 1,
    courseTitle: 'Web Development Bootcamp',
    title: 'C Block Lab Evaluation & Portfolio Submission Guidelines',
    message:
      'Please verify responsive grid behavior across 390px and 1280px breakpoints before uploading your portfolio deliverable.',
    authorName: 'Dr. Sarah Johnson',
    priority: 'Important',
    createdAt: '2026-11-22T09:30:00.000Z'
  },
  {
    id: 'ann_2',
    courseId: 4,
    courseTitle: 'Data Structures & Algorithmic Optimization',
    title: 'Central Library Peer Review Clinic (L-Block Atrium)',
    message:
      'Teaching assistants will hold asymptotic runtime office hours on Thursday from 16:00 to 18:30 in L-Block.',
    authorName: 'Dr. Elena Vance',
    priority: 'General',
    createdAt: '2026-11-24T11:00:00.000Z'
  }
];

const INITIAL_MATERIALS = [
  {
    id: 'mat_1',
    courseId: 1,
    title: 'CSS Grid & Layout Architecture Reference Sheet',
    type: 'PDF',
    summary: 'Concise layout patterns, responsive media queries, and semantic HTML5 landmarks for C Block studio assignments.',
    uploadedBy: 'Dr. Sarah Johnson',
    createdAt: '2026-11-10T08:00:00.000Z'
  },
  {
    id: 'mat_2',
    courseId: 1,
    title: 'Frontend Accessibility Checklist & Form Patterns',
    type: 'Slides',
    summary: 'ARIA roles, focus management, keyboard navigation, and client-side form state patterns.',
    uploadedBy: 'Dr. Sarah Johnson',
    createdAt: '2026-11-14T10:15:00.000Z'
  },
  {
    id: 'mat_3',
    courseId: 2,
    title: 'NumPy Array Indexing & Vectorization Notebook',
    type: 'Code',
    summary: 'Worked broadcasting and linear algebra snippets for Python & Machine Learning Foundations.',
    uploadedBy: 'Prof. Michael Chen',
    createdAt: '2026-11-12T12:00:00.000Z'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    targetRole: 'student',
    title: 'Assignment Graded: Sorting Algorithms Benchmarking Lab',
    body: 'Dr. Elena Vance recorded a score of 98/100 with faculty feedback.',
    category: 'grade',
    readBy: [],
    createdAt: '2026-11-20T15:00:00.000Z'
  },
  {
    id: 'notif_2',
    targetRole: 'student',
    title: 'Faculty Notice: C Block Lab Evaluation Guidelines',
    body: 'Dr. Sarah Johnson posted new verification guidance for Web Development Bootcamp.',
    category: 'announcement',
    readBy: [],
    createdAt: '2026-11-22T09:30:00.000Z'
  },
  {
    id: 'notif_3',
    targetRole: 'instructor',
    title: '1 Pending Student Deliverable Ready for Review',
    body: 'Submission in Python & Machine Learning Foundations awaits final faculty confirmation.',
    category: 'submission',
    readBy: [],
    createdAt: '2026-11-24T13:15:00.000Z'
  }
];

const INITIAL_ACTIVITY_LOG = [
  {
    id: 'act_1',
    type: 'grade',
    actorName: 'Dr. Sarah Johnson',
    actorRole: 'instructor',
    targetTitle: 'Sorting Algorithms Benchmarking Lab',
    detail: 'Graded deliverable with 98/100 score',
    timestamp: '2026-11-20T15:00:00.000Z'
  },
  {
    id: 'act_2',
    type: 'announcement',
    actorName: 'Dr. Sarah Johnson',
    actorRole: 'instructor',
    targetTitle: 'Web Development Bootcamp',
    detail: 'Published C Block Lab Evaluation & Portfolio Submission Guidelines',
    timestamp: '2026-11-22T09:30:00.000Z'
  },
  {
    id: 'act_3',
    type: 'quiz',
    actorName: 'Ananya Iyer',
    actorRole: 'student',
    targetTitle: 'Web Development Bootcamp',
    detail: 'Completed module examination with 80%',
    timestamp: '2026-11-18T09:30:00.000Z'
  }
];

// Safe LocalStorage JSON helpers
export const getStoredItem = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`LocalStorage read error for key "${key}":`, err);
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`LocalStorage write error for key "${key}":`, err);
    return false;
  }
};

export const appendActivityLog = ({ type, actorName, actorRole, targetTitle, detail }) => {
  const existing = getStoredItem(KEYS.ACTIVITY_LOG, INITIAL_ACTIVITY_LOG);
  const entry = {
    id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: type || 'event',
    actorName: actorName || 'Campus User',
    actorRole: actorRole || 'student',
    targetTitle: targetTitle || 'LearnSphere LMS',
    detail: detail || '',
    timestamp: new Date().toISOString()
  };
  const updated = [entry, ...existing].slice(0, 80);
  setStoredItem(KEYS.ACTIVITY_LOG, updated);
  return updated;
};

export const pushNotification = ({ targetRole = 'all', targetUserId = null, title, body, category = 'info' }) => {
  const existing = getStoredItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const item = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    targetRole,
    targetUserId,
    title,
    body,
    category,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  const updated = [item, ...existing].slice(0, 60);
  setStoredItem(KEYS.NOTIFICATIONS, updated);
  return updated;
};

// Initialize persistent database WITHOUT auto-logging in any user
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.USERS_DB)) {
    setStoredItem(KEYS.USERS_DB, DEFAULT_USERS);
  }
  if (!localStorage.getItem(KEYS.STUDENT_STATES)) {
    setStoredItem(KEYS.STUDENT_STATES, INITIAL_STUDENT_STATES);
  }
  if (!localStorage.getItem(KEYS.ASSIGNMENTS)) {
    const normalized = assignmentsData.map((a) => ({
      ...a,
      studentId: a.status !== 'Pending' ? 'std_1' : null,
      studentName: a.status !== 'Pending' ? 'Alex Morgan' : ''
    }));
    setStoredItem(KEYS.ASSIGNMENTS, normalized);
  }
  if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
    setStoredItem(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }
  if (!localStorage.getItem(KEYS.COURSE_MATERIALS)) {
    setStoredItem(KEYS.COURSE_MATERIALS, INITIAL_MATERIALS);
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    setStoredItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
  if (!localStorage.getItem(KEYS.ACTIVITY_LOG)) {
    setStoredItem(KEYS.ACTIVITY_LOG, INITIAL_ACTIVITY_LOG);
  }
  if (!localStorage.getItem(KEYS.CUSTOM_COURSES)) {
    setStoredItem(KEYS.CUSTOM_COURSES, []);
  }
  if (!localStorage.getItem(KEYS.COURSE_OVERRIDES)) {
    setStoredItem(KEYS.COURSE_OVERRIDES, {});
  }
  if (!localStorage.getItem(KEYS.CUSTOM_QUIZZES)) {
    setStoredItem(KEYS.CUSTOM_QUIZZES, {});
  }
  if (!localStorage.getItem(KEYS.THEME)) {
    setStoredItem(KEYS.THEME, 'dark');
  }
};

// User Operations (Strictly returns null when logged out)
export const getCurrentUser = () => getStoredItem(KEYS.CURRENT_USER, null);

export const setCurrentUser = (user) => {
  if (!user) {
    localStorage.removeItem(KEYS.CURRENT_USER);
    return;
  }
  setStoredItem(KEYS.CURRENT_USER, user);
};

export const getUsersDB = () => getStoredItem(KEYS.USERS_DB, DEFAULT_USERS);

export const registerUser = (userObj) => {
  const users = getUsersDB();
  const exists = users.find((u) => u.email.toLowerCase() === userObj.email.toLowerCase());
  if (exists) return { error: 'An account with this email already exists.' };

  const newUser = {
    id: `usr_${Date.now()}`,
    ...userObj,
    avatar: userObj.avatar || generateAvatar(userObj.name, userObj.role),
    streak: 1,
    studyHours: 0,
    studentId:
      userObj.role === 'instructor'
        ? `KL-FAC-${Math.floor(1000 + Math.random() * 9000)}`
        : userObj.role === 'admin'
        ? `KL-ADM-${Math.floor(1000 + Math.random() * 9000)}`
        : `KL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    joinedDate: new Date().toISOString().split('T')[0]
  };

  setStoredItem(KEYS.USERS_DB, [...users, newUser]);

  if (newUser.role === 'student') {
    const states = getAllStudentStates();
    states[newUser.id] = { enrolled: [], progress: {}, completedLessons: [], quizResults: {} };
    setStoredItem(KEYS.STUDENT_STATES, states);
  }

  appendActivityLog({
    type: 'user',
    actorName: newUser.name,
    actorRole: newUser.role,
    targetTitle: newUser.department || 'KL University',
    detail: `Registered ${newUser.role} account`
  });

  return { success: true, user: newUser };
};

export const updateStoredUser = (updatedFields) => {
  const current = getCurrentUser();
  if (!current) return null;
  const updated = { ...current, ...updatedFields };
  setCurrentUser(updated);

  const db = getUsersDB();
  const newDb = db.map((u) => (u.id === current.id ? { ...u, ...updatedFields } : u));
  setStoredItem(KEYS.USERS_DB, newDb);
  return updated;
};

export const deleteStoredUser = (userId) => {
  const db = getUsersDB();
  const target = db.find((u) => u.id === userId);
  const newDb = db.filter((u) => u.id !== userId);
  setStoredItem(KEYS.USERS_DB, newDb);
  if (target) {
    appendActivityLog({
      type: 'admin',
      actorName: getCurrentUser()?.name || 'Administrator',
      actorRole: 'admin',
      targetTitle: target.name,
      detail: `Removed user account (${target.email})`
    });
  }
  return newDb;
};

export const updateUserRole = (userId, newRole) => {
  const db = getUsersDB();
  let targetName = '';
  const newDb = db.map((u) => {
    if (u.id === userId) {
      targetName = u.name;
      return { ...u, role: newRole };
    }
    return u;
  });
  setStoredItem(KEYS.USERS_DB, newDb);

  if (targetName) {
    appendActivityLog({
      type: 'admin',
      actorName: getCurrentUser()?.name || 'Administrator',
      actorRole: 'admin',
      targetTitle: targetName,
      detail: `Updated governance role to ${newRole}`
    });
  }
  return newDb;
};

// Course Operations
export const getAllCourses = () => {
  const custom = getStoredItem(KEYS.CUSTOM_COURSES, []);
  const overrides = getStoredItem(KEYS.COURSE_OVERRIDES, {});
  return [...coursesData, ...custom].map((c) => {
    const ov = overrides[c.id];
    return ov ? { ...c, ...ov, id: c.id } : c;
  });
};

export const updateCourseRecord = (courseId, updatedFields, actor) => {
  const numId = Number(courseId);
  const overrides = getStoredItem(KEYS.COURSE_OVERRIDES, {});
  const nextOv = {
    ...overrides,
    [numId]: { ...(overrides[numId] || {}), ...updatedFields }
  };
  setStoredItem(KEYS.COURSE_OVERRIDES, nextOv);

  const custom = getStoredItem(KEYS.CUSTOM_COURSES, []);
  const customIdx = custom.findIndex((c) => Number(c.id) === numId);
  if (customIdx !== -1) {
    const nextCustom = custom.map((c) => (Number(c.id) === numId ? { ...c, ...updatedFields, id: c.id } : c));
    setStoredItem(KEYS.CUSTOM_COURSES, nextCustom);
  }

  appendActivityLog({
    type: 'course',
    actorName: actor?.name || 'Faculty Instructor',
    actorRole: actor?.role || 'instructor',
    targetTitle: updatedFields.title || `Course #${numId}`,
    detail: 'Updated course syllabus metadata'
  });

  return getAllCourses();
};

export const addCustomCourse = (newCourse, actor) => {
  const custom = getStoredItem(KEYS.CUSTOM_COURSES, []);
  const all = [...coursesData, ...custom];
  const maxId = all.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);

  const defaultModules = [
    {
      id: 'mod-1',
      title: 'Module 1: Course Foundations & Architecture',
      lessons: [
        {
          id: `${maxId + 1}-1`,
          title: `${newCourse.title}: Orientation & Core Principles`,
          duration: '16:30',
          videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
          completed: false
        },
        {
          id: `${maxId + 1}-2`,
          title: 'Applied Workshop & Implementation Lab',
          duration: '22:15',
          videoUrl: 'https://www.youtube.com/embed/kUMe1FH4CHE',
          completed: false
        }
      ]
    }
  ];

  const courseToAdd = {
    ...newCourse,
    id: maxId + 1,
    lessonsCount: newCourse.modules?.flatMap((m) => m.lessons || []).length || 2,
    rating: newCourse.rating || 4.9,
    reviewsCount: 1,
    badge: newCourse.badge || 'Faculty Published',
    image: newCourse.image || '/assets/images/web-dev.svg',
    whatYouWillLearn:
      newCourse.whatYouWillLearn?.length > 0
        ? newCourse.whatYouWillLearn
        : [
            `Understand foundational principles of ${newCourse.title}`,
            'Complete hands-on KLU campus lab exercises',
            'Prepare for course examination certification'
          ],
    prerequisites:
      newCourse.prerequisites?.length > 0
        ? newCourse.prerequisites
        : ['Foundational university academic readiness'],
    modules: newCourse.modules?.length > 0 ? newCourse.modules : defaultModules
  };

  setStoredItem(KEYS.CUSTOM_COURSES, [...custom, courseToAdd]);
  appendActivityLog({
    type: 'course',
    actorName: actor?.name || courseToAdd.instructor || 'Faculty Member',
    actorRole: actor?.role || 'instructor',
    targetTitle: courseToAdd.title,
    detail: `Published new course under ${courseToAdd.departmentName}`
  });
  pushNotification({
    targetRole: 'student',
    title: `New Course Published: ${courseToAdd.title}`,
    body: `${courseToAdd.instructor} opened enrollment under ${courseToAdd.departmentName}.`,
    category: 'course'
  });
  return [...coursesData, ...custom, courseToAdd];
};

export const deleteCourse = (courseId, actor) => {
  const custom = getStoredItem(KEYS.CUSTOM_COURSES, []);
  const target = custom.find((c) => Number(c.id) === Number(courseId));
  const updatedCustom = custom.filter((c) => Number(c.id) !== Number(courseId));
  setStoredItem(KEYS.CUSTOM_COURSES, updatedCustom);

  if (target) {
    appendActivityLog({
      type: 'course',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'admin',
      targetTitle: target.title,
      detail: 'Archived faculty course'
    });
  }
  return getAllCourses();
};

// Per-Student Enrollment, Progress & Quiz State
export const getAllStudentStates = () => getStoredItem(KEYS.STUDENT_STATES, INITIAL_STUDENT_STATES);

export const getStudentState = (userId) => {
  if (!userId) {
    return { enrolled: [], progress: {}, completedLessons: [], quizResults: {} };
  }
  const all = getAllStudentStates();
  return all[userId] || { enrolled: [], progress: {}, completedLessons: [], quizResults: {} };
};

const saveStudentState = (userId, nextState) => {
  if (!userId) return;
  const all = getAllStudentStates();
  all[userId] = nextState;
  setStoredItem(KEYS.STUDENT_STATES, all);
};

export const getEnrolledCourses = (userId) => getStudentState(userId).enrolled;

export const enrollInCourse = (courseId, userId, actor) => {
  if (!userId) return [];
  const state = getStudentState(userId);
  const numId = Number(courseId);
  if (!state.enrolled.includes(numId)) {
    const nextEnrolled = [...state.enrolled, numId];
    const nextProgress = { ...state.progress, [numId]: state.progress[numId] || 0 };
    saveStudentState(userId, { ...state, enrolled: nextEnrolled, progress: nextProgress });

    const course = getAllCourses().find((c) => Number(c.id) === numId);
    appendActivityLog({
      type: 'enrollment',
      actorName: actor?.name || 'Student',
      actorRole: actor?.role || 'student',
      targetTitle: course?.title || `Course #${numId}`,
      detail: 'Enrolled in accredited course'
    });
    return nextEnrolled;
  }
  return state.enrolled;
};

export const getCourseProgress = (userId) => getStudentState(userId).progress;
export const getCompletedLessons = (userId) => getStudentState(userId).completedLessons;

export const toggleLessonCompleted = (lessonId, courseId, totalLessons, userId, actor) => {
  if (!userId) return { completedLessons: [], progress: {} };
  const state = getStudentState(userId);
  const numId = Number(courseId);
  const exists = state.completedLessons.includes(lessonId);
  const completedLessons = exists
    ? state.completedLessons.filter((id) => id !== lessonId)
    : [...state.completedLessons, lessonId];

  const courseCompletedCount = completedLessons.filter((l) => l.startsWith(`${numId}-`)).length;
  const pct = totalLessons > 0 ? Math.min(100, Math.round((courseCompletedCount / totalLessons) * 100)) : 0;
  const progress = { ...state.progress, [numId]: pct };

  saveStudentState(userId, { ...state, completedLessons, progress });

  if (!exists) {
    const course = getAllCourses().find((c) => Number(c.id) === numId);
    appendActivityLog({
      type: 'lesson',
      actorName: actor?.name || 'Student',
      actorRole: 'student',
      targetTitle: course?.title || `Course #${numId}`,
      detail: `Completed lesson ${lessonId} (${pct}% course mastery)`
    });
  }

  return { completedLessons, progress };
};

// Quizzes
export const getQuizResults = (userId) => getStudentState(userId).quizResults;

export const saveQuizResult = (courseId, score, total, userId, actor) => {
  const numId = Number(courseId);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 60;
  const resultRecord = {
    score,
    total,
    percentage,
    passed,
    date: new Date().toISOString()
  };

  if (userId) {
    const state = getStudentState(userId);
    const nextQuizResults = { ...state.quizResults, [numId]: resultRecord };
    saveStudentState(userId, { ...state, quizResults: nextQuizResults });

    const course = getAllCourses().find((c) => Number(c.id) === numId);
    appendActivityLog({
      type: 'quiz',
      actorName: actor?.name || 'Student',
      actorRole: actor?.role || 'student',
      targetTitle: course?.title || `Course #${numId}`,
      detail: `${passed ? 'Passed' : 'Attempted'} examination with ${percentage}%`
    });
  }

  return resultRecord;
};

export const getAllCustomQuizzes = () => getStoredItem(KEYS.CUSTOM_QUIZZES, {});

export const getCourseQuizQuestions = (courseId) => {
  const numId = Number(courseId);
  const custom = getAllCustomQuizzes();
  if (custom[numId] && Array.isArray(custom[numId]) && custom[numId].length > 0) {
    return custom[numId];
  }
  return quizData[numId] || quizData[1];
};

export const addCourseQuizQuestion = (courseId, questionObj, actor) => {
  const numId = Number(courseId);
  const allCustom = getAllCustomQuizzes();
  const baseQuestions = getCourseQuizQuestions(numId);
  const nextQuestions = [...baseQuestions, questionObj];
  const updated = { ...allCustom, [numId]: nextQuestions };
  setStoredItem(KEYS.CUSTOM_QUIZZES, updated);

  const course = getAllCourses().find((c) => Number(c.id) === numId);
  appendActivityLog({
    type: 'quiz',
    actorName: actor?.name || 'Instructor',
    actorRole: actor?.role || 'instructor',
    targetTitle: course?.title || `Course #${numId}`,
    detail: `Added exam question: "${questionObj.question.slice(0, 48)}..."`
  });
  return updated;
};

export const deleteCourseQuizQuestion = (courseId, qIndex) => {
  const numId = Number(courseId);
  const allCustom = getAllCustomQuizzes();
  const current = [...getCourseQuizQuestions(numId)];
  if (current.length <= 1) return allCustom;
  current.splice(qIndex, 1);
  const updated = { ...allCustom, [numId]: current };
  setStoredItem(KEYS.CUSTOM_QUIZZES, updated);
  return updated;
};

// Assignments Operations
export const getAssignments = () => getStoredItem(KEYS.ASSIGNMENTS, assignmentsData);

export const submitAssignment = (assignmentId, submissionText, actor) => {
  const list = getAssignments();
  let submittedTitle = '';
  const updated = list.map((a) => {
    if (a.id === assignmentId) {
      submittedTitle = a.title;
      return {
        ...a,
        status: 'Submitted',
        submissionText,
        submissionDate: new Date().toISOString(),
        studentId: actor?.id || a.studentId || 'std_1',
        studentName: actor?.name || a.studentName || 'Student'
      };
    }
    return a;
  });
  setStoredItem(KEYS.ASSIGNMENTS, updated);

  if (submittedTitle) {
    appendActivityLog({
      type: 'assignment',
      actorName: actor?.name || 'Student',
      actorRole: actor?.role || 'student',
      targetTitle: submittedTitle,
      detail: 'Submitted coursework for faculty evaluation'
    });
    pushNotification({
      targetRole: 'instructor',
      title: `New Deliverable Submitted: ${submittedTitle}`,
      body: `${actor?.name || 'A student'} uploaded a submission ready for grading.`,
      category: 'submission'
    });
  }
  return updated;
};

export const createAssignmentRecord = (data, actor) => {
  const list = getAssignments();
  const newItem = {
    id: `assign_${Date.now()}`,
    courseId: Number(data.courseId) || 1,
    title: data.title,
    course: data.course,
    department: data.department || 'Computer Science & Engineering',
    description: data.description,
    dueDate: data.dueDate || '2026-12-15',
    points: Number(data.points) || 100,
    status: 'Pending',
    submissionText: '',
    grade: null,
    feedback: '',
    instructions: data.instructions || 'Submit structured solution summary or repository link.',
    studentId: null,
    studentName: ''
  };
  const updated = [newItem, ...list];
  setStoredItem(KEYS.ASSIGNMENTS, updated);

  appendActivityLog({
    type: 'assignment',
    actorName: actor?.name || 'Instructor',
    actorRole: actor?.role || 'instructor',
    targetTitle: newItem.title,
    detail: `Published assignment for ${newItem.course} (Due ${newItem.dueDate})`
  });
  pushNotification({
    targetRole: 'student',
    title: `New Assignment: ${newItem.title}`,
    body: `Due ${newItem.dueDate} for ${newItem.course}.`,
    category: 'assignment'
  });
  return updated;
};

export const gradeAssignmentRecord = (assignmentId, grade, feedback, actor) => {
  const list = getAssignments();
  let gradedTitle = '';
  const updated = list.map((a) => {
    if (a.id === assignmentId) {
      gradedTitle = a.title;
      return {
        ...a,
        status: 'Graded',
        grade: Number(grade),
        feedback: feedback || 'Evaluated by course faculty.',
        gradedBy: actor?.name || 'Faculty',
        gradedAt: new Date().toISOString()
      };
    }
    return a;
  });
  setStoredItem(KEYS.ASSIGNMENTS, updated);

  if (gradedTitle) {
    appendActivityLog({
      type: 'grade',
      actorName: actor?.name || 'Instructor',
      actorRole: actor?.role || 'instructor',
      targetTitle: gradedTitle,
      detail: `Awarded ${grade}/100 with faculty feedback`
    });
    pushNotification({
      targetRole: 'student',
      title: `Assignment Graded: ${gradedTitle}`,
      body: `${actor?.name || 'Faculty'} posted score ${grade}/100.`,
      category: 'grade'
    });
  }
  return updated;
};

// Announcements Operations
export const getAnnouncements = () => getStoredItem(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);

export const addAnnouncementRecord = (data, actor) => {
  const list = getAnnouncements();
  const item = {
    id: `ann_${Date.now()}`,
    courseId: data.courseId ? Number(data.courseId) : null,
    courseTitle: data.courseTitle || 'All Campus Cohorts',
    title: data.title,
    message: data.message,
    authorName: actor?.name || 'Faculty Lead',
    priority: data.priority || 'General',
    createdAt: new Date().toISOString()
  };
  const updated = [item, ...list];
  setStoredItem(KEYS.ANNOUNCEMENTS, updated);

  appendActivityLog({
    type: 'announcement',
    actorName: item.authorName,
    actorRole: actor?.role || 'instructor',
    targetTitle: item.courseTitle,
    detail: `Posted notice: ${item.title}`
  });
  pushNotification({
    targetRole: 'student',
    title: `${item.priority === 'Important' ? 'Urgent Notice' : 'Announcement'}: ${item.title}`,
    body: `${item.courseTitle} — ${item.message.slice(0, 96)}`,
    category: 'announcement'
  });
  return updated;
};

export const deleteAnnouncementRecord = (id) => {
  const updated = getAnnouncements().filter((a) => a.id !== id);
  setStoredItem(KEYS.ANNOUNCEMENTS, updated);
  return updated;
};

// Learning Materials Operations
export const getCourseMaterials = () => getStoredItem(KEYS.COURSE_MATERIALS, INITIAL_MATERIALS);

export const addCourseMaterialRecord = (data, actor) => {
  const list = getCourseMaterials();
  const item = {
    id: `mat_${Date.now()}`,
    courseId: Number(data.courseId) || 1,
    title: data.title,
    type: data.type || 'PDF',
    summary: data.summary || '',
    uploadedBy: actor?.name || 'Course Faculty',
    createdAt: new Date().toISOString()
  };
  const updated = [item, ...list];
  setStoredItem(KEYS.COURSE_MATERIALS, updated);

  appendActivityLog({
    type: 'material',
    actorName: item.uploadedBy,
    actorRole: actor?.role || 'instructor',
    targetTitle: item.title,
    detail: `Uploaded ${item.type} resource for Course #${item.courseId}`
  });
  return updated;
};

export const deleteCourseMaterialRecord = (id) => {
  const updated = getCourseMaterials().filter((m) => m.id !== id);
  setStoredItem(KEYS.COURSE_MATERIALS, updated);
  return updated;
};

// Notifications & Activity Log Operations
export const getNotifications = () => getStoredItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

export const markNotificationRead = (notifId, userId) => {
  if (!userId) return getNotifications();
  const updated = getNotifications().map((n) =>
    n.id === notifId && !(n.readBy || []).includes(userId)
      ? { ...n, readBy: [...(n.readBy || []), userId] }
      : n
  );
  setStoredItem(KEYS.NOTIFICATIONS, updated);
  return updated;
};

export const markAllNotificationsRead = (userId) => {
  if (!userId) return getNotifications();
  const updated = getNotifications().map((n) =>
    !(n.readBy || []).includes(userId)
      ? { ...n, readBy: [...(n.readBy || []), userId] }
      : n
  );
  setStoredItem(KEYS.NOTIFICATIONS, updated);
  return updated;
};

export const getActivityLog = () => getStoredItem(KEYS.ACTIVITY_LOG, INITIAL_ACTIVITY_LOG);
