import React from 'react';
import { Shield, Settings, User } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const AdminSidebarHeader: React.FC = () => {
  const { user, signOut, isSuperAdmin, isAdmin } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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

  if (isCollapsed) {
    return (
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 rounded-full p-0 hover:bg-accent transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getUserInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56">
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
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
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
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader className="border-b border-border p-3 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="space-y-3">
        {/* Brand Section */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-bold tracking-tight truncate bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Uppi.ai Management
            </p>
          </div>
        </div>
      </div>
    </SidebarHeader>
  );
};