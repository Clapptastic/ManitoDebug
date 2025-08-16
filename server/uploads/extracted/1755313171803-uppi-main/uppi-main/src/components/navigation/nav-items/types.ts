
import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types/auth/roles';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
  description?: string;
}

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
  roles?: UserRole[];
  requiredRole?: UserRole;
  disabled?: boolean;
  badge?: string;
  badgeVariant?: string;
  external?: boolean;
}
