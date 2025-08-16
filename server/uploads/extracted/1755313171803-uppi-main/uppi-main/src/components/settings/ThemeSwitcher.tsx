
import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ThemeSwitcher: React.FC = () => {
  const { isDarkTheme, toggleTheme, setDarkTheme } = useTheme();
  
  // Since we only have a boolean isDarkTheme value but the UI needs multiple theme options,
  // we'll simulate the "theme" string value
  const theme = isDarkTheme ? "dark" : "light";
  
  // Define a function to set the theme based on string value
  const setTheme = (newTheme: string) => {
    if (newTheme === 'dark') {
      setDarkTheme(true);
    } else if (newTheme === 'light') {
      setDarkTheme(false);
    } else if (newTheme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkTheme(systemPrefersDark);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {theme === 'light' ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : theme === 'dark' ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : theme === 'system' ? (
            <Monitor className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sparkles className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
