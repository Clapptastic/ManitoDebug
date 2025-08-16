import { useAuthContext } from '@/hooks/auth/useAuthContext';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  enabled: boolean;
}

export interface FrontendPermission {
  id: string;
  role: string;
  component_path: string;
  is_visible: boolean;
  is_enabled: boolean;
}

export const useFrontendPermissions = () => {
  const { isAdmin, isSuperAdmin } = useAuthContext();

  const defaultPermissions: Permission[] = [
    { id: 'admin_panel', name: 'Admin Panel Access', description: 'Access to admin panel', module: 'admin', enabled: isAdmin || isSuperAdmin },
    { id: 'user_management', name: 'User Management', description: 'Manage users and roles', module: 'admin', enabled: isSuperAdmin },
    { id: 'system_settings', name: 'System Settings', description: 'Modify system configuration', module: 'admin', enabled: isSuperAdmin },
  ];

  return {
    permissions: defaultPermissions,
    hasPermission: (permissionId: string) => {
      return defaultPermissions.find(p => p.id === permissionId)?.enabled || false;
    },
    isLoading: false,
    error: null,
  };
};

export const usePermissionsManagement = () => {
  const allPermissions = new Map<string, FrontendPermission[]>();
  
  return {
    allPermissions,
    loading: false,
    saving: false,
    error: null,
    updatePermission: async (role: string, componentPath: string, field: string, value: boolean) => true,
    saveAllPermissions: async () => true,
    resetToDefaults: async () => {},
    refreshPermissions: async () => {},
  };
};