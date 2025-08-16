import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Search, 
  FileText, 
  Bot,
  Building2,
  BarChart3,
  Users,
  Shield,
  Settings,
  HelpCircle,
  CreditCard,
  Database,
  ChevronRight,
  Briefcase,
  Target,
  Star
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuGroup,
  SidebarHeader,
  SidebarFooter,
  SidebarSection,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { 
        title: 'Dashboard', 
        url: '/', 
        icon: Home,
        description: 'Your main workspace'
      },
      { 
        title: 'Company Profile', 
        url: '/company-profile', 
        icon: Building2,
        description: 'Manage your company details'
      },
    ]
  },
  {
    label: 'Market Intelligence',
    items: [
      { 
        title: 'Market Research', 
        url: '/market-research', 
        icon: TrendingUp,
        description: 'Explore market opportunities'
      },
      { 
        title: 'Competitor Analysis', 
        url: '/market-research/competitor-analysis', 
        icon: Search,
        description: 'Analyze your competition',
        badge: 'Popular'
      },
      { 
        title: 'Saved Analyses', 
        url: '/market-research/saved-analyses', 
        icon: FileText,
        description: 'Your research history'
      },
      { 
        title: 'Market Insights', 
        url: '/saved-market-analyses', 
        icon: Target,
        description: 'Market trend analysis'
      },
    ]
  },
  {
    label: 'Business Tools',
    items: [
      { 
        title: 'AI Assistant', 
        url: '/chat', 
        icon: Bot,
        description: 'Get AI-powered guidance'
      },
      { 
        title: 'Business Plan', 
        url: '/business-plan', 
        icon: Briefcase,
        description: 'Create and manage your plan'
      },
      { 
        title: 'MVP Builder', 
        url: '/mvp-builder', 
        icon: Building2,
        description: 'Build your minimum viable product'
      },
      { 
        title: 'Analytics', 
        url: '/analytics', 
        icon: BarChart3,
        description: 'Track your progress'
      },
    ]
  },
  {
    label: 'Workspace',
    items: [
      { 
        title: 'Documents', 
        url: '/documents', 
        icon: Database,
        description: 'Store and organize files'
      },
      { 
        title: 'Teams', 
        url: '/teams', 
        icon: Users,
        description: 'Collaborate with your team'
      },
      { 
        title: 'Business Tools', 
        url: '/business-tools', 
        icon: BarChart3,
        description: 'Additional utilities'
      },
    ]
  },
  {
    label: 'Account',
    items: [
      { 
        title: 'Billing', 
        url: '/billing', 
        icon: CreditCard,
        description: 'Manage your subscription'
      },
      { 
        title: 'API Keys', 
        url: '/api-keys', 
        icon: Shield,
        description: 'Configure integrations'
      },
      { 
        title: 'Settings', 
        url: '/settings', 
        icon: Settings,
        description: 'Account preferences'
      },
      { 
        title: 'Support', 
        url: '/support', 
        icon: HelpCircle,
        description: 'Get help when you need it'
      },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const currentPath = location.pathname;
  
  const isCollapsed = state === 'collapsed';
  
  // Helper function to check if current path matches item URL
  const isActive = (url: string) => {
    if (url === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(url);
  };

  return (
    <Sidebar className={cn("transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
      <SidebarHeader className="border-b border-border p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold">AI Entrepreneur</h1>
              <p className="text-xs text-muted-foreground">Your AI-powered business platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {navigationGroups.map((group) => (
          <SidebarSection key={group.label} className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 mb-2">
                {group.label}
              </h3>
            )}
            
            <SidebarMenu className="space-y-1">
              {group.items.map((item) => {
                const itemIsActive = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton active={itemIsActive}>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3 w-full group"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        
                        {!isCollapsed && (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                                {item.description}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100" />
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarSection>
        ))}

        {/* Admin Section */}
        {isSuperAdmin && (
          <SidebarSection className="mt-6 pt-6 border-t border-border">
            {!isCollapsed && (
              <h3 className="text-xs font-medium text-amber-600 uppercase tracking-wider px-2 py-1 mb-2 bg-amber-50 rounded-md">
                Admin
              </h3>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton active={isActive('/admin')}>
                  <NavLink 
                    to="/admin" 
                    className="flex items-center gap-3 w-full group"
                  >
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <div className="flex-1">
                          <span className="truncate font-medium">Admin Panel</span>
                          <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                            System administration
                          </p>
                        </div>
                        <Star className="h-3 w-3" />
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarSection>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? 'Super Admin' : 'User'}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}