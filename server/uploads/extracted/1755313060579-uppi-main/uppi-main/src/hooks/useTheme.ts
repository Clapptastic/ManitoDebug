
import { useContext } from 'react';
import { ThemeContext, ThemeProviderState } from '@/contexts/ThemeContext';

/**
 * Custom hook for accessing theme context
 * @returns ThemeProviderState - The current theme state and methods
 */
export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeContext);
  
  if (!context) {
    // Provide a fallback value instead of throwing an error
    return {
      isDarkTheme: false,
      toggleTheme: () => console.warn('ThemeProvider not found'),
      setDarkTheme: () => console.warn('ThemeProvider not found')
    };
  }
  
  return context;
}

export default useTheme;
