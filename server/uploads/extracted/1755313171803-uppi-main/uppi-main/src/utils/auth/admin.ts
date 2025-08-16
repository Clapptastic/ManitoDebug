import { UserRole } from '@/types/auth/roles';

/**
 * Admin utility functions for role checking and permissions
 */

/**
 * Check if user has admin role
 */
export function isAdmin(roles: UserRole[]): boolean {
  return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.SUPER_ADMIN);
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(roles: UserRole[]): boolean {
  return roles.includes(UserRole.SUPER_ADMIN);
}

/**
 * Check if user has any admin privileges
 */
export function hasAdminAccess(roles: UserRole[]): boolean {
  return isAdmin(roles) || isSuperAdmin(roles);
}

/**
 * Check if user can access specific admin feature
 */
export function canAccessAdminFeature(
  userRoles: UserRole[],
  requiredRole: UserRole = UserRole.ADMIN
): boolean {
  if (!userRoles.length) return false;
  
  // Super admin can access everything
  if (userRoles.includes(UserRole.SUPER_ADMIN)) return true;
  
  // Check specific role requirements
  if (requiredRole === UserRole.SUPER_ADMIN) {
    return userRoles.includes(UserRole.SUPER_ADMIN);
  }
  
  if (requiredRole === UserRole.ADMIN) {
    return userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.SUPER_ADMIN);
  }
  
  return false;
}

/**
 * Get admin navigation items based on user roles
 */
export function getAdminNavItems(userRoles: UserRole[]) {
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
      title: 'Schema Viewer',
      href: '/admin/schema-viewer',
      roles: [UserRole.SUPER_ADMIN]
    },
    {
      title: 'Development Tools',
      href: '/admin/development',
      roles: [UserRole.SUPER_ADMIN]
    }
  ];
  
  if (!userRoles.length) return [];
  
  let items = baseItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );
  
  if (isSuperAdmin(userRoles)) {
    items = [...items, ...superAdminItems];
  }
  
  return items;
}

/**
 * Special access emails for development and testing
 */
const SPECIAL_ACCESS_EMAILS = [
  'akclapp@gmail.com',
  'samdyer27@gmail.com'
];

/**
 * Check if email has special access privileges
 */
export function hasSpecialAccess(email?: string): boolean {
  if (!email) return false;
  return SPECIAL_ACCESS_EMAILS.includes(email.toLowerCase());
}