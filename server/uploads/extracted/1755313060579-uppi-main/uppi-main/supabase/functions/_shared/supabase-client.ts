import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Standardized Supabase client factory
 * Provides consistent configuration across all edge functions
 */

interface ClientConfig {
  useServiceRole?: boolean;
  authToken?: string;
  skipAuth?: boolean;
}

/**
 * Create authenticated Supabase client with consistent configuration
 */
export function createSupabaseClient(config: ClientConfig = {}): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  // Determine which key to use
  let key: string;
  if (config.useServiceRole) {
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    key = supabaseServiceKey;
  } else {
    if (!supabaseAnonKey) {
      throw new Error('Missing SUPABASE_ANON_KEY environment variable');
    }
    key = supabaseAnonKey;
  }

  // Configure auth options
  const authOptions: any = {
    autoRefreshToken: false,
    persistSession: false
  };

  // Set global headers if auth token provided
  const globalHeaders: Record<string, string> = {};
  if (config.authToken && !config.skipAuth) {
    globalHeaders.Authorization = config.authToken;
  }

  return createClient(supabaseUrl, key, {
    auth: authOptions,
    global: {
      headers: globalHeaders
    }
  });
}

/**
 * Get authenticated user from request headers
 */
export async function getAuthenticatedUser(supabase: SupabaseClient, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}