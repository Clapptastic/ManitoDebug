import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Database,
  Code,
  Package,
  AlertTriangle,
  BarChart3,
  Shield,
  GitBranch,
  FileText,
} from 'lucide-react';

const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'System Health', url: '/admin/system-health', icon: Activity },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'API Management', url: '/admin/api', icon: Code },
  { title: 'Error Logs', url: '/admin/errors', icon: AlertTriangle },
  { title: 'Database', url: '/admin/database', icon: Database },
  { title: 'Type Coverage', url: '/admin/type-coverage', icon: FileText },
  { title: 'Package Updates', url: '/admin/packages', icon: Package },
  { title: 'Security', url: '/admin/security', icon: Shield },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin' || currentPath === '/admin/';
    }
    return currentPath.startsWith(path);
  };

  const isExpanded = adminItems.some((item) => isActive(item.url));

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return active 
      ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary' 
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';
  };

  return (
    <Sidebar
      className={collapsed ? 'w-14' : 'w-60'}
      collapsible
    >
      <SidebarContent>
        <SidebarGroup
          open={isExpanded}
        >
          <SidebarGroupLabel className={collapsed ? 'hidden' : 'block'}>
            Admin Panel
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="ml-2 truncate">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}