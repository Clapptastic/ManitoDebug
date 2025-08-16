import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth/roles';
import { AuthContextType, AuthProviderProps } from '@/types/auth';
import { authDebugger } from '@/utils/debugging/auth-debugger';
import { authService } from '@/services/auth/authService';

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Cache for user roles to prevent unnecessary API calls
const roleCache = new Map<string, { roles: UserRole[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Unified Authentication Provider
 * Single source of truth for all authentication and role management
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider: Component initializing');
  
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  console.log('AuthProvider: State', { user: user?.email, loading, initialized, error: error?.message });
  
  // Prevent duplicate concurrent role fetches
  const roleFetchInProgressRef = useRef(false);

  // Fetch user roles from database using auth service
  const fetchUserRoles = useCallback(async (userId: string): Promise<UserRole[]> => {
    // Check cache first
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.roles;
    }

    try {
      setRoleLoading(true);
      
      const roles = await authService.getUserRoles(userId);

      // Cache the result
      roleCache.set(userId, { roles, timestamp: Date.now() });
      
      authDebugger.logAuthEvent('Roles fetched', { userId, roles });
      return roles;
      
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Fallback: check if super admin by email
      if (user?.email && ['akclapp@gmail.com', 'samdyer27@gmail.com'].includes(user.email)) {
        return [UserRole.SUPER_ADMIN];
      }
      return [UserRole.USER];
    } finally {
      setRoleLoading(false);
    }
  }, [user?.email]);

  // Role checking function
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!userRoles.length) return false;
    
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    
    return userRoles.includes(role);
  }, [userRoles]);

  // Computed role properties
  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);
  const hasSpecialAccess = isSuperAdmin; // Can be extended with other special access logic
  
  // Auth operations using the auth service
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const result = await authService.signIn({ email, password });

      if (!result.success) {
        authDebugger.logAuthEvent('Sign in failed', { error: result.error?.message });
        setError(result.error || new Error('Sign in failed'));
      } else {
        authDebugger.logAuthEvent('Sign in successful', { userId: result.data?.user?.id });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return { success: false, data: null, error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      const result = await authService.signUp({ 
        email, 
        password, 
        fullName: metadata?.fullName,
        metadata 
      });

      if (!result.success) {
        authDebugger.logAuthEvent('Sign up failed', { error: result.error?.message });
        setError(result.error || new Error('Sign up failed'));
      } else {
        authDebugger.logAuthEvent('Sign up successful', { userId: result.data?.user?.id });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return { success: false, data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      authDebugger.logAuthEvent('Sign out initiated');
      
      // Clear role cache
      if (user?.id) {
        roleCache.delete(user.id);
      }
      
      const result = await authService.signOut();
      if (result.success) {
        authDebugger.logAuthEvent('Sign out successful');
      } else {
        console.error('Sign out error:', result.error);
        setError(result.error || new Error('Sign out failed'));
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Sign out error:', error);
    }
  }, [user?.id]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      const result = await authService.resetPassword(email);

      if (!result.success) {
        authDebugger.logAuthEvent('Password reset failed', { error: result.error?.message });
        setError(result.error || new Error('Password reset failed'));
      } else {
        authDebugger.logAuthEvent('Password reset email sent', { email });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return { success: false, error };
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      // Clear cache to force refresh
      roleCache.delete(user.id);
      const roles = await fetchUserRoles(user.id);
      setUserRoles(roles);
    }
  }, [user?.id, fetchUserRoles]);

  const getSession = useCallback(async () => {
    return await authService.getCurrentSession();
  }, []);

  const refreshSession = useCallback(async () => {
    const result = await authService.refreshSession();
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
    }
  }, []);

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST using auth service
        const { data: { subscription } } = authService.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            authDebugger.logAuthEvent('Auth state changed', { event, userId: session?.user?.id });
            
            // Update session and user synchronously
            setSession(session);
            setUser(session?.user ?? null);
            
            // Give time for session to propagate before allowing API calls
            setTimeout(() => {
              if (mounted) {
                setLoading(false);
                setInitialized(true);
              }
            }, 100);

            // Fetch roles asynchronously if user exists
            if (session?.user) {
              setTimeout(async () => {
                if (!mounted) return;
                if (roleFetchInProgressRef.current) return;
                roleFetchInProgressRef.current = true;
                try {
                  const roles = await fetchUserRoles(session.user!.id);
                  if (mounted) setUserRoles(roles);
                } finally {
                  roleFetchInProgressRef.current = false;
                }
              }, 200);
            } else {
              setUserRoles([]);
              // Clear all user caches on sign out
              roleCache.clear();
            }
          }
        );

        // THEN check for existing session using auth service
        const session = await authService.getCurrentSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setInitialized(true);
          
          if (session?.user) {
            if (!roleFetchInProgressRef.current) {
              roleFetchInProgressRef.current = true;
              try {
                const roles = await fetchUserRoles(session.user.id);
                setUserRoles(roles);
              } finally {
                roleFetchInProgressRef.current = false;
              }
            }
          }
          
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error as Error);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup.then(fn => fn && fn());
    };
  }, [fetchUserRoles]);

  // Debug auth state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      authDebugger.debugAuthState(user, session, userRoles[0], hasSpecialAccess);
    }
  }, [user, session, userRoles, hasSpecialAccess]);

  // Construct the context value
  const contextValue: AuthContextType = {
    // State
    user,
    session,
    loading,
    initialized,
    roleLoading,
    isAuthenticated: !!user && !!session,
    userRoles,
    isAdmin,
    isSuperAdmin,
    hasSpecialAccess,
    error,
    
    // Operations
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
    refreshRoles,
    getSession,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};