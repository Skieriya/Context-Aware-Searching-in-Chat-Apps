
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'yellow';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark

  useEffect(() => {
    // This effect runs once on client mount to set the initial theme from localStorage
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && (storedTheme === 'dark' || storedTheme === 'yellow')) {
      setTheme(storedTheme);
    }
    // If no valid theme in localStorage, it defaults to 'dark' from useState
    // The class application will be handled by the next useEffect
  }, []);

  useEffect(() => {
    // This effect runs whenever the theme state changes
    const root = document.documentElement;

    // Remove all potential theme classes first to ensure a clean state
    root.classList.remove('dark', 'theme-yellow');

    // Add the class for the current theme
    if (theme === 'yellow') {
      root.classList.add('theme-yellow');
    } else { // theme === 'dark'
      root.classList.add('dark'); // Add 'dark' class for the dark theme
    }

    // Save the current theme to localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'yellow' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
