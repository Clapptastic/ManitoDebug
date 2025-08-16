import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { adminService } from '@/services/adminService';

interface AdminState {
  systemHealth: any;
  users: any[];
  analytics: any;
  packageDependencies: any[];
  loading: {
    systemHealth: boolean;
    users: boolean;
    analytics: boolean;
    packages: boolean;
  };
  errors: {
    systemHealth: string | null;
    users: string | null;
    analytics: string | null;
    packages: string | null;
  };
  lastUpdated: {
    systemHealth: number | null;
    users: number | null;
    analytics: number | null;
    packages: number | null;
  };
}

type AdminAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof AdminState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AdminState['errors']; value: string | null } }
  | { type: 'SET_SYSTEM_HEALTH'; payload: any }
  | { type: 'SET_USERS'; payload: any[] }
  | { type: 'SET_ANALYTICS'; payload: any }
  | { type: 'SET_PACKAGES'; payload: any[] }
  | { type: 'CLEAR_ALL_ERRORS' };

const initialState: AdminState = {
  systemHealth: null,
  users: [],
  analytics: null,
  packageDependencies: [],
  loading: {
    systemHealth: false,
    users: false,
    analytics: false,
    packages: false,
  },
  errors: {
    systemHealth: null,
    users: null,
    analytics: null,
    packages: null,
  },
  lastUpdated: {
    systemHealth: null,
    users: null,
    analytics: null,
    packages: null,
  },
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'SET_SYSTEM_HEALTH':
      return {
        ...state,
        systemHealth: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          systemHealth: Date.now(),
        },
        errors: {
          ...state.errors,
          systemHealth: null,
        },
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          users: Date.now(),
        },
        errors: {
          ...state.errors,
          users: null,
        },
      };
    case 'SET_ANALYTICS':
      return {
        ...state,
        analytics: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          analytics: Date.now(),
        },
        errors: {
          ...state.errors,
          analytics: null,
        },
      };
    case 'SET_PACKAGES':
      return {
        ...state,
        packageDependencies: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          packages: Date.now(),
        },
        errors: {
          ...state.errors,
          packages: null,
        },
      };
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {
          systemHealth: null,
          users: null,
          analytics: null,
          packages: null,
        },
      };
    default:
      return state;
  }
}

interface AdminContextType {
  state: AdminState;
  actions: {
    fetchSystemHealth: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchAnalytics: (timeRange?: string) => Promise<void>;
    fetchPackages: () => Promise<void>;
    updateUserRole: (userId: string, role: string) => Promise<void>;
    refreshAll: () => Promise<void>;
    clearErrors: () => void;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const isDataStale = (lastUpdated: number | null) => {
    return !lastUpdated || (Date.now() - lastUpdated) > CACHE_DURATION;
  };

  const fetchSystemHealth = async () => {
    if (!isAdmin || state.loading.systemHealth) return;
    if (!isDataStale(state.lastUpdated.systemHealth)) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'systemHealth', value: true } });
    
    try {
      console.log('[AdminContext] Fetching system health');
      const health = await adminService.fetchSystemHealth();
      dispatch({ type: 'SET_SYSTEM_HEALTH', payload: health });
    } catch (error) {
      console.error('[AdminContext] Error fetching system health:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'systemHealth', value: (error as Error).message } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'systemHealth', value: false } });
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin || state.loading.users) return;
    if (!isDataStale(state.lastUpdated.users)) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'users', value: true } });
    
    try {
      console.log('[AdminContext] Fetching users');
      const users = await adminService.getUsers();
      dispatch({ type: 'SET_USERS', payload: users });
    } catch (error) {
      console.error('[AdminContext] Error fetching users:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'users', value: (error as Error).message } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'users', value: false } });
    }
  };

  const fetchAnalytics = async (timeRange = '30d') => {
    if (!isAdmin || state.loading.analytics) return;
    if (!isDataStale(state.lastUpdated.analytics)) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'analytics', value: true } });
    
    try {
      console.log('[AdminContext] Fetching analytics');
      const analytics = await adminService.getAnalytics(timeRange);
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      console.error('[AdminContext] Error fetching analytics:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'analytics', value: (error as Error).message } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'analytics', value: false } });
    }
  };

  const fetchPackages = async () => {
    if (!isAdmin || state.loading.packages) return;
    if (!isDataStale(state.lastUpdated.packages)) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'packages', value: true } });
    
    try {
      console.log('[AdminContext] Fetching packages');
      const packages = await adminService.getPackageDependencies();
      dispatch({ type: 'SET_PACKAGES', payload: packages });
    } catch (error) {
      console.error('[AdminContext] Error fetching packages:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'packages', value: (error as Error).message } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'packages', value: false } });
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    if (!isAdmin) return;

    try {
      console.log('[AdminContext] Updating user role:', userId, role);
      await adminService.updateUserRole(userId, role as any);
      // Refresh users after update
      await fetchUsers();
    } catch (error) {
      console.error('[AdminContext] Error updating user role:', error);
      throw error;
    }
  };

  const refreshAll = async () => {
    if (!isAdmin) return;

    console.log('[AdminContext] Refreshing all admin data');
    await Promise.all([
      fetchSystemHealth(),
      fetchUsers(),
      fetchAnalytics(),
      fetchPackages(),
    ]);
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  };

  // Auto-fetch data when user becomes admin
  useEffect(() => {
    if (isAdmin && !roleLoading) {
      console.log('[AdminContext] User is admin, fetching initial data');
      refreshAll();
    }
  }, [isAdmin, roleLoading]);

  const contextValue: AdminContextType = {
    state,
    actions: {
      fetchSystemHealth,
      fetchUsers,
      fetchAnalytics,
      fetchPackages,
      updateUserRole,
      refreshAll,
      clearErrors,
    },
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;