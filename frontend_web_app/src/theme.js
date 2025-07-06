import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme color palette as per style guide
const COLORS = {
  primary: '#4F8A8B',
  secondary: '#FBD46D',
  accent: '#FF5959',
  backgroundLight: '#ffffff',
  backgroundDark: '#1A1A1A',
  textLight: '#fff',
  textDark: '#282c34'
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// PUBLIC_INTERFACE
export function ThemeProvider({ children }) {
  /**
   * Provides theme state and toggler.
   * Theme colors can be referenced by useTheme() hook.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Set CSS variables at root for palette
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', COLORS.primary);
    root.style.setProperty('--color-secondary', COLORS.secondary);
    root.style.setProperty('--color-accent', COLORS.accent);
    root.style.setProperty('--background-light', COLORS.backgroundLight);
    root.style.setProperty('--background-dark', COLORS.backgroundDark);
    root.style.setProperty('--text-light', COLORS.textLight);
    root.style.setProperty('--text-dark', COLORS.textDark);
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}
