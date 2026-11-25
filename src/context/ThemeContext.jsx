import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, KEYS } from '../utils/storage';

const ThemeContext = createContext();

const THEME_USER_SET_KEY = 'learnSphere_themeExplicit';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const hasExplicitChoice = getStoredItem(THEME_USER_SET_KEY, false);
    if (hasExplicitChoice) {
      return getStoredItem(KEYS.THEME, 'dark');
    }
    return 'dark'; // Unified architectural obsidian/midnight palette default
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStoredItem(KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setStoredItem(THEME_USER_SET_KEY, true);
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
