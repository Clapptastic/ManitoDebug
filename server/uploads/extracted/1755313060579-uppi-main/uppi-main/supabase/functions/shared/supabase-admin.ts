import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Creates a Supabase admin client with service role privileges
 * Used for bypassing RLS policies when needed
 */
export function createSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Creates a regular Supabase client with user authentication
 */
export function createSupabaseClient(authToken?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  if (authToken) {
    client.auth.setSession({
      access_token: authToken.replace('Bearer ', ''),
      refresh_token: ''
    } as any);
  }

  return client;
}