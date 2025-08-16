
import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeProviderState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setDarkTheme: (isDark: boolean) => void;
}

export const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'theme'
}) => {
  // Initialize theme from localStorage or system preference
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultTheme === 'dark';
    
    const storedTheme = localStorage.getItem(storageKey);
    
    if (storedTheme) {
      return storedTheme === 'dark';
    }
    
    if (defaultTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return defaultTheme === 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', isDarkTheme);
    
    // Save preference
    localStorage.setItem(storageKey, isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme, storageKey]);

  // Add listener for system theme changes
  useEffect(() => {
    if (defaultTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (event: MediaQueryListEvent) => {
        setIsDarkTheme(event.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [defaultTheme]);

  // Toggle between dark and light theme
  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  // Set theme directly
  const setDarkTheme = (isDark: boolean) => setIsDarkTheme(isDark);

  const value: ThemeProviderState = {
    isDarkTheme,
    toggleTheme,
    setDarkTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
