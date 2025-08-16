
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/types/auth/roles';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { AdminSidebarContent } from './AdminSidebarContent';
import { AdminSidebarHeader } from './AdminSidebarHeader';
import { AdminSidebarFooter } from './AdminSidebarFooter';

interface AdminSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  userRole?: UserRole;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  isMobile,
  toggleSidebar,
  userRole
}) => {
  return (
    <Sidebar className="border-r border-border bg-card">
      <AdminSidebarHeader />
      <AdminSidebarContent userRole={userRole} />
      <AdminSidebarFooter />
    </Sidebar>
  );
};

export default AdminSidebar;
