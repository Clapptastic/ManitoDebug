
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Settings, User, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const AdminHeader: React.FC = () => {
  const { user, signOut, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getRoleDisplay = () => {
    if (isSuperAdmin) return { label: 'Super Admin', variant: 'destructive' as const };
    if (isAdmin) return { label: 'Admin', variant: 'default' as const };
    return { label: 'User', variant: 'secondary' as const };
  };

  const roleInfo = getRoleDisplay();

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-8">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Back to App Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:bg-accent/50 transition-colors px-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to App</span>
        </Button>
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-4 hover:bg-accent/50 transition-colors duration-200 px-4 py-3 h-auto rounded-lg"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/10 shadow-sm">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getUserInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium truncate max-w-32">
                    {user?.user_metadata?.full_name || 'Admin User'}
                  </span>
                  <Badge variant={roleInfo.variant} className="text-xs">
                    {roleInfo.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-32">
                  {user?.email}
                </span>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mr-0">{/* Removed margin to align flush with edge */}
            <div className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <Badge variant={roleInfo.variant} className="text-xs w-fit">
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Admin Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={signOut}
              className="flex items-center space-x-2 text-destructive focus:text-destructive"
            >
              <Shield className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHeader;
