
import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useThemeHook } from '@/hooks/useTheme';
import { ThemeProviderState } from '@/contexts/ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

// Create context
const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

/**
 * Theme provider component
 * Provides theme context to all child components
 */
export function ThemeProvider({ 
  children,
  defaultTheme,
  storageKey
}: ThemeProviderProps) {
  const themeContext = useThemeHook();
  
  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook for consuming theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}

export default ThemeProvider;
