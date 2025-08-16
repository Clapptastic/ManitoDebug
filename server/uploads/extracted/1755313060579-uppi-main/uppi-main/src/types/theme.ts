
// Define the Theme type to include 'unicorn'
export type Theme = 'light' | 'dark' | 'unicorn';

// Optional: Create an enum for better type safety
export enum ThemeEnum {
  LIGHT = 'light',
  DARK = 'dark',
  UNICORN = 'unicorn'
}

// Export a function to validate themes
export function isValidTheme(value: string): value is Theme {
  return ['light', 'dark', 'unicorn'].includes(value);
}

export function getNextTheme(currentTheme: Theme): Theme {
  switch (currentTheme) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'unicorn';
    case 'unicorn':
      return 'light';
    default:
      return 'light';
  }
}
