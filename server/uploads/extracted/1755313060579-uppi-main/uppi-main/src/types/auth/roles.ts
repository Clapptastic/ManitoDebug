/**
 * User Roles and Permissions
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export type UserRoleString = keyof typeof UserRole;

export const userRoleDisplayNames: Record<UserRole, string> = {
  [UserRole.USER]: 'User',
  [UserRole.ADMIN]: 'Admin', 
  [UserRole.SUPER_ADMIN]: 'Super Admin'
};

export interface UserPermissions {
  canManageUsers: boolean;
  canManageSystem: boolean;
  canViewAnalytics: boolean;
  canManageApiKeys: boolean;
}

export const rolePermissions: Record<UserRole, UserPermissions> = {
  [UserRole.USER]: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAnalytics: false,
    canManageApiKeys: true
  },
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageSystem: false,
    canViewAnalytics: true,
    canManageApiKeys: true
  },
  [UserRole.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageSystem: true,
    canViewAnalytics: true,
    canManageApiKeys: true
  }
};