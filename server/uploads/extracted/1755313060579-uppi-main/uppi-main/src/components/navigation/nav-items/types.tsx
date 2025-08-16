
import React from 'react';
import { UserRole } from '@/types/auth/roles';

/**
 * Common structure for navigation items
 */
export interface BaseNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  disabled?: boolean;
  external?: boolean;
}

/**
 * Nav item specifically for admin navigation
 */
export interface AdminNavItem extends BaseNavItem {
  path: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  requiredRole?: UserRole;
  roles?: UserRole[];
}

/**
 * Nav item for main app navigation
 */
export interface AppNavItem extends BaseNavItem {
  children?: AppNavItem[];
  section?: string;
  beta?: boolean;
  requiresAuth?: boolean;
}
