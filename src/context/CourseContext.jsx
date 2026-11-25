import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getAllCourses,
  getAllStudentStates,
  getStudentState,
  enrollInCourse,
  toggleLessonCompleted,
  saveQuizResult,
  getAssignments,
  submitAssignment,
  createAssignmentRecord,
  gradeAssignmentRecord,
  addCustomCourse,
  updateCourseRecord,
  deleteCourse,
  getAnnouncements,
  addAnnouncementRecord,
  deleteAnnouncementRecord,
  getCourseMaterials,
  addCourseMaterialRecord,
  deleteCourseMaterialRecord,
  getAllCustomQuizzes,
  getCourseQuizQuestions,
  addCourseQuizQuestion,
  deleteCourseQuizQuestion,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLog
} from '../utils/storage';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState([]);
  const [studentStates, setStudentStates] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [customQuizzes, setCustomQuizzes] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const refreshData = useCallback(() => {
    setCourses(getAllCourses());
    setStudentStates(getAllStudentStates());
    setAssignments(getAssignments());
    setAnnouncements(getAnnouncements());
    setMaterials(getCourseMaterials());
    setCustomQuizzes(getAllCustomQuizzes());
    setNotifications(getNotifications());
    setActivityLog(getActivityLog());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData, user?.id]);

  // Active user's personal progress/enrollment slices
  const currentStudentState = useMemo(() => {
    if (!isAuthenticated || !user?.id) {
      return { enrolled: [], progress: {}, completedLessons: [], quizResults: {} };
    }
    return studentStates[user.id] || getStudentState(user.id);
  }, [isAuthenticated, user?.id, studentStates]);

  const enrolledIds = currentStudentState.enrolled || [];
  const progress = currentStudentState.progress || {};
  const completedLessons = currentStudentState.completedLessons || [];
  const quizResults = currentStudentState.quizResults || {};

  // Actions
  const enroll = (courseId) => {
    if (!isAuthenticated || !user?.id) return [];
    const next = enrollInCourse(courseId, user.id, user);
    refreshData();
    return next;
  };

  const isEnrolled = (courseId) => enrolledIds.includes(Number(courseId));

  const getCourseById = (id) => courses.find((c) => Number(c.id) === Number(id));

  const enrolledCourses = courses.filter((c) => enrolledIds.includes(Number(c.id)));

  const markLessonComplete = (lessonId, courseId, totalLessons) => {
    if (!isAuthenticated || !user?.id) return null;
    const res = toggleLessonCompleted(lessonId, courseId, totalLessons, user.id, user);
    refreshData();
    return res;
  };

  const isLessonCompleted = (lessonId) => completedLessons.includes(lessonId);

  const recordQuiz = (courseId, score, total) => {
    const res = saveQuizResult(courseId, score, total, isAuthenticated ? user?.id : null, user);
    refreshData();
    return res;
  };

  const getQuizForCourse = (courseId) => getCourseQuizQuestions(courseId);

  const addQuizQuestion = (courseId, qObj) => {
    const res = addCourseQuizQuestion(courseId, qObj, user);
    refreshData();
    return res;
  };

  const removeQuizQuestion = (courseId, index) => {
    const res = deleteCourseQuizQuestion(courseId, index);
    refreshData();
    return res;
  };

  const submitAssign = (assignmentId, text) => {
    const updated = submitAssignment(assignmentId, text, user);
    refreshData();
    return updated;
  };

  const createAssignment = (data) => {
    const updated = createAssignmentRecord(data, user);
    refreshData();
    return updated;
  };

  const gradeAssignment = (assignmentId, grade, feedback) => {
    const updated = gradeAssignmentRecord(assignmentId, grade, feedback, user);
    refreshData();
    return updated;
  };

  const createCourse = (newCourseData) => {
    const updated = addCustomCourse(newCourseData, user);
    refreshData();
    return updated;
  };

  const editCourse = (courseId, updatedFields) => {
    const updated = updateCourseRecord(courseId, updatedFields, user);
    refreshData();
    return updated;
  };

  const removeCourse = (courseId) => {
    const updated = deleteCourse(courseId, user);
    refreshData();
    return updated;
  };

  const addAnnouncement = (data) => {
    const updated = addAnnouncementRecord(data, user);
    refreshData();
    return updated;
  };

  const removeAnnouncement = (id) => {
    const updated = deleteAnnouncementRecord(id);
    refreshData();
    return updated;
  };

  const addMaterial = (data) => {
    const updated = addCourseMaterialRecord(data, user);
    refreshData();
    return updated;
  };

  const removeMaterial = (id) => {
    const updated = deleteCourseMaterialRecord(id);
    refreshData();
    return updated;
  };

  const userNotifications = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return notifications.filter(
      (n) =>
        n.targetRole === 'all' ||
        n.targetRole === user.role ||
        (n.targetUserId && n.targetUserId === user.id)
    );
  }, [notifications, isAuthenticated, user]);

  const unreadNotificationsCount = useMemo(() => {
    if (!isAuthenticated || !user) return 0;
    return userNotifications.filter((n) => !(n.readBy || []).includes(user.id)).length;
  }, [userNotifications, isAuthenticated, user]);

  const markNotifRead = (id) => {
    if (!user?.id) return;
    markNotificationRead(id, user.id);
    refreshData();
  };

  const markAllNotifsRead = () => {
    if (!user?.id) return;
    markAllNotificationsRead(user.id);
    refreshData();
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        enrolledIds,
        enrolledCourses,
        progress,
        completedLessons,
        quizResults,
        studentStates,
        assignments,
        announcements,
        materials,
        customQuizzes,
        notifications: userNotifications,
        unreadNotificationsCount,
        activityLog,
        enroll,
        isEnrolled,
        getCourseById,
        markLessonComplete,
        isLessonCompleted,
        recordQuiz,
        getQuizForCourse,
        addQuizQuestion,
        removeQuizQuestion,
        submitAssign,
        createAssignment,
        gradeAssignment,
        createCourse,
        editCourse,
        removeCourse,
        addAnnouncement,
        removeAnnouncement,
        addMaterial,
        removeMaterial,
        markNotifRead,
        markAllNotifsRead,
        refreshData
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => useContext(CourseContext);
