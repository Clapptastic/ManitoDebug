import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export async function authenticateUser(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'user'
  };
}

export function requireAuth(allowedRoles?: string[]) {
  return async (request: Request): Promise<AuthUser> => {
    const user = await authenticateUser(request);
    
    if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
}