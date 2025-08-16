import { UserRole } from '@/types/auth/roles';

/**
 * Admin utility functions for role checking and permissions
 */

/**
 * Check if user has admin role
 */
export function isAdmin(role?: UserRole | string | null): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(role?: UserRole | string | null): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Check if user has any admin privileges
 */
export function hasAdminAccess(role?: UserRole | string | null): boolean {
  return isAdmin(role) || isSuperAdmin(role);
}

/**
 * Check if user can access specific admin feature
 */
export function canAccessAdminFeature(
  userRole?: UserRole | string | null,
  requiredRole: UserRole = UserRole.ADMIN
): boolean {
  if (!userRole) return false;
  
  // Super admin can access everything
  if (userRole === UserRole.SUPER_ADMIN) return true;
  
  // Check specific role requirements
  if (requiredRole === UserRole.SUPER_ADMIN) {
    return userRole === UserRole.SUPER_ADMIN;
  }
  
  if (requiredRole === UserRole.ADMIN) {
    return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  }
  
  return false;
}

/**
 * Get admin navigation items based on user role
 */
export function getAdminNavItems(userRole?: UserRole | string | null) {
  const baseItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      title: 'Users',
      href: '/admin/users',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      title: 'System Health',
      href: '/admin/system-health',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    }
  ];
  
  const superAdminItems = [
    {
      title: 'Type Coverage',
      href: '/admin/type-coverage',
      roles: [UserRole.SUPER_ADMIN]
    },
    {
      title: 'Development Tools',
      href: '/admin/development',
      roles: [UserRole.SUPER_ADMIN]
    }
  ];
  
  if (!userRole) return [];
  
  let items = baseItems.filter(item => 
    item.roles.includes(userRole as UserRole)
  );
  
  if (isSuperAdmin(userRole)) {
    items = [...items, ...superAdminItems];
  }
  
  return items;
}

/**
 * Special access emails for development and testing
 */
const SPECIAL_ACCESS_EMAILS = [
  'admin@example.com',
  'superadmin@test.com'
];

/**
 * Check if email has special access privileges
 */
export function hasSpecialAccess(email?: string): boolean {
  if (!email) return false;
  return SPECIAL_ACCESS_EMAILS.includes(email.toLowerCase());
}
