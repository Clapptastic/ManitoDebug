/**
 * CONSOLIDATED Supabase Client
 * Single source of truth for all Supabase client operations
 * Re-exports from the main client with additional utility functions
 */

import { Session, User } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Re-export the main client and connection checker
export { supabase, checkSupabaseConnection };

/**
 * Get the current user with error handling
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    toast({
      title: 'Authentication Error',
      description: 'Failed to retrieve user information',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Get the current session with error handling
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    toast({
      title: 'Authentication Error',
      description: 'Failed to retrieve session information',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Default export for backwards compatibility
 */
export default supabase;