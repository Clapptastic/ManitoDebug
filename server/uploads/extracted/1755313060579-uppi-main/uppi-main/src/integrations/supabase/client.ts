
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Supabase project URL and anon key
// Using concrete values instead of environment variables for better reliability
const supabaseUrl = "https://jqbdjttdaihidoyalqvs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo";

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

/**
 * Check if the Supabase client is properly configured
 * @returns {boolean} True if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Check if the Supabase connection is working
 * @param {number} timeout - Timeout in milliseconds
 * @returns Promise that resolves to a boolean indicating connection status
 */
export async function checkSupabaseConnection(timeout = 5000): Promise<boolean> {
  try {
    // Create a promise that will timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    // Create a lightweight query that doesn't require auth
    const connectionPromise = new Promise<boolean>(async (resolve) => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        resolve(!error);
      } catch (e) {
        console.error('Error checking Supabase connection:', e);
        resolve(false);
      }
    });

    // Race the connection check against the timeout
    return Promise.race([connectionPromise, timeoutPromise]);
  } catch (e) {
    console.error('Error in checkSupabaseConnection:', e);
    return false;
  }
}

/**
 * Get the current session
 * @returns Promise with the current session
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
  }
  return data.session;
};

/**
 * Get the current user
 * @returns Promise with the current user or null
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

export default supabase;
