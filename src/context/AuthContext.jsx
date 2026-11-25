import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeStorage,
  getCurrentUser,
  setCurrentUser,
  getUsersDB,
  registerUser,
  updateStoredUser,
  deleteStoredUser,
  updateUserRole,
  generateAvatar
} from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    initializeStorage();
    return getCurrentUser();
  });
  const [allUsers, setAllUsers] = useState(() => getUsersDB());
  const loading = false;

  useEffect(() => {
    setUser(getCurrentUser());
    setAllUsers(getUsersDB());
  }, []);

  const refreshUsersList = useCallback(() => {
    setAllUsers(getUsersDB());
  }, []);

  const login = (email, password) => {
    const db = getUsersDB();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const found = db.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, message: 'No account found with this university email address.' };
    }

    if (found.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(found);
    setUser(found);
    setAllUsers(db);
    return { success: true, user: found };
  };

  // Explicit demo sign-in used solely from the Login portal
  const loginAs = (role) => {
    const db = getUsersDB();
    const target = db.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      setUser(target);
      setAllUsers(db);
      return { success: true, user: target };
    }
    return { success: false, message: 'Demo account unavailable.' };
  };

  const signup = (formData) => {
    const allowedRole = formData.role === 'instructor' ? 'instructor' : 'student';
    const res = registerUser({
      name: String(formData.name || '').trim(),
      email: String(formData.email || '').trim(),
      password: formData.password,
      role: allowedRole,
      department: formData.department || 'Computer Science & Engineering',
      headline:
        allowedRole === 'instructor'
          ? `Faculty Member • ${formData.department || 'KL University'}`
          : `Degree Scholar • ${formData.department || 'KL University'}`,
      avatar: generateAvatar(formData.name, allowedRole)
    });

    if (res.error) {
      return { success: false, message: res.error };
    }

    setCurrentUser(res.user);
    setUser(res.user);
    refreshUsersList();
    return { success: true, user: res.user };
  };

  const createUserAccount = (formData) => {
    const res = registerUser({
      name: String(formData.name || '').trim(),
      email: String(formData.email || '').trim(),
      password: formData.password || 'password123',
      role: formData.role || 'student',
      department: formData.department || 'Computer Science & Engineering',
      headline: formData.headline || `KL University ${formData.role || 'student'} member`,
      avatar: generateAvatar(formData.name, formData.role || 'student')
    });
    if (res.error) return { success: false, message: res.error };
    refreshUsersList();
    return { success: true, user: res.user };
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const updateProfile = (fields) => {
    const updated = updateStoredUser(fields);
    if (updated) {
      setUser(updated);
      refreshUsersList();
    }
    return updated;
  };

  const removeUserAccount = (userId) => {
    const newDb = deleteStoredUser(userId);
    setAllUsers(newDb);
    return newDb;
  };

  const changeUserRole = (userId, newRole) => {
    const newDb = updateUserRole(userId, newRole);
    setAllUsers(newDb);
    if (user && user.id === userId) {
      const updatedSelf = { ...user, role: newRole };
      setCurrentUser(updatedSelf);
      setUser(updatedSelf);
    }
    return newDb;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        loading,
        login,
        loginAs,
        signup,
        createUserAccount,
        logout,
        updateProfile,
        removeUserAccount,
        changeUserRole,
        refreshUsersList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
