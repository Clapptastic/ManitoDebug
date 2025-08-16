import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth/roles';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuGroup,
  useSidebar
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { adminItems, AdminNavItem } from './AdminNavItems';
import { cn } from '@/lib/utils';

interface AdminSidebarContentProps {
  userRole?: UserRole;
}

export const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ userRole }) => {
  const { user, hasSpecialAccess, isSuperAdmin, isAdmin, loading: roleLoading } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Enhanced navigation groups with better organization and visual hierarchy
  const navigationGroups = [
    {
      id: 'overview',
      label: 'Overview',
      priority: 1,
      items: adminItems.filter(item => 
        ['', 'system-health', 'analytics'].includes(item.path)
      )
    },
    {
      id: 'core',
      label: 'Core Management',
      priority: 2,
      items: adminItems.filter(item => 
        ['user-management', 'api-management', 'affiliate'].includes(item.path)
      )
    },
    {
      id: 'development',
      label: 'Development Tools',
      priority: 3,
      items: adminItems.filter(item => 
        ['dev-tools', 'system-testing', 'codewiki', 'wiki', 'code-embeddings', 'package-updates', 'debug-functions'].includes(item.path)
      )
    },
    {
      id: 'system',
      label: 'System Administration',
      priority: 4,
      items: adminItems.filter(item => 
        ['database-optimizer', 'security-audit', 'vault-audit', 'legal-compliance', 'schema-viewer', 'database', 'microservices', 'data-points-management', 'feature-flags', 'type-coverage', 'nav-coverage', 'unused-components', 'system-optimization'].includes(item.path)
      )
    },
    {
      id: 'advanced',
      label: 'Advanced',
      priority: 5,
      items: adminItems.filter(item => 
        ['super-admin', 'master-profiles', 'analysis-flow', 'permissions', 'prompts', 'flows'].includes(item.path)
      )
    },
    {
      id: 'preferences',
      label: 'Preferences',
      priority: 6,
      items: adminItems.filter(item => 
        item.path === 'settings'
      )
    }
  ];

  const filterItemsByRole = (items: AdminNavItem[]) => {
    return items.filter(item => {
      if (isSuperAdmin) return true;
      if (item.requiredRole === UserRole.SUPER_ADMIN && !isSuperAdmin) return false;
      if (item.requiredRole && !isAdmin && !hasSpecialAccess) return false;
      return true;
    });
  };

  // Show loading state with skeleton
  if (roleLoading) {
    return (
      <SidebarContent className="px-3 py-4">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-8 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SidebarContent>
    );
  }

  const isActiveLink = (href: string, path: string) => {
    if (path === '') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.includes(path);
  };

  // Enhanced MenuItem component with better interactions
  const MenuItem = ({ item, isActive, isCollapsed }: { 
    item: AdminNavItem; 
    isActive: boolean; 
    isCollapsed: boolean; 
  }) => {
    const Icon = item.icon;
    
    const menuButton = (
      <SidebarMenuButton
        active={isActive}
        className={cn(
          "w-full justify-start transition-all duration-200 group relative",
          "hover:bg-accent/50 hover:text-accent-foreground hover-scale",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isActive && "bg-primary/10 text-primary border-r-2 border-primary font-medium",
          isCollapsed ? "px-2 justify-center" : "px-3"
        )}
      >
        <Icon className={cn(
          "flex-shrink-0 transition-all duration-200",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          isCollapsed ? "h-5 w-5" : "h-4 w-4"
        )} />
        
        {!isCollapsed && (
          <div className="flex items-center justify-between w-full min-w-0 ml-3">
            <span className="truncate text-sm font-medium">
              {item.title}
            </span>
            {item.badge && (
              <Badge 
                variant={item.badgeVariant || 'secondary'}
                className={cn(
                  "text-xs ml-2 flex-shrink-0 transition-all duration-200",
                  "group-hover:scale-105"
                )}
              >
                {item.badge}
              </Badge>
            )}
          </div>
        )}

        {/* Active indicator */}
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={item.href} className="block">
                {menuButton}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || 'secondary'} className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link to={item.href} className="block">
        {menuButton}
      </Link>
    );
  };

  return (
    <SidebarContent className={cn("transition-all duration-200", isCollapsed ? "px-2" : "px-3")}>
      <div className="space-y-6 py-4">
        {navigationGroups.map((group, groupIndex) => {
          const filteredItems = filterItemsByRole(group.items);
          
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.id} className={cn(
              "animate-fade-in",
              "animation-delay-" + (groupIndex * 100)
            )}>
              {/* Group separator for visual hierarchy */}
              {groupIndex > 0 && (
                <Separator className="mb-4 opacity-50" />
              )}
              
              <SidebarMenuGroup 
                label={!isCollapsed ? group.label : undefined}
                className={cn(
                  "transition-all duration-200",
                  !isCollapsed && "mb-2"
                )}
              >
                <SidebarMenu className="space-y-1">
                  {filteredItems.map((item, itemIndex) => {
                    const isActive = isActiveLink(item.href, item.path);
                    
                    return (
                      <SidebarMenuItem 
                        key={item.href}
                        className={cn(
                          "animate-fade-in",
                          "animation-delay-" + ((groupIndex * 100) + (itemIndex * 50))
                        )}
                      >
                        <MenuItem 
                          item={item} 
                          isActive={isActive} 
                          isCollapsed={isCollapsed} 
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarMenuGroup>
            </div>
          );
        })}
      </div>
    </SidebarContent>
  );
};