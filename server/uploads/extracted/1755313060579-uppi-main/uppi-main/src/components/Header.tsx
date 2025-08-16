
import { useState } from 'react';
import { useAuthContext } from '@/hooks/auth/useAuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Menu, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut, isSuperAdmin, isAdmin } = useAuthContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">AI Entrepreneur</span>
          </Link>
        </div>
        <div className="hidden flex-1 md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80">
              Dashboard
            </Link>
            <Link to="/market-research" className="transition-colors hover:text-foreground/80">
              Market Research
            </Link>
            <Link to="/market-research/competitor-analysis" className="transition-colors hover:text-foreground/80">
              Competitor Analysis
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" className="transition-colors hover:text-foreground/80 text-primary font-medium">
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email || "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/chat">AI Chatbot</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/documents">Documents</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/business-plan">Business Plan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/api-keys">API Keys</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col space-y-2 p-4 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80">
              Dashboard
            </Link>
            <Link to="/market-research" className="transition-colors hover:text-foreground/80">
              Market Research
            </Link>
            <Link to="/market-research/competitor-analysis" className="transition-colors hover:text-foreground/80">
              Competitor Analysis
            </Link>
            <Link to="/business-plan" className="transition-colors hover:text-foreground/80">
              Business Plan
            </Link>
            <Link to="/resources" className="transition-colors hover:text-foreground/80">
              Resources
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
