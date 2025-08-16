
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createSupabaseAdmin } from './shared/supabase-admin.ts';
import { corsHeaders } from './shared/cors.ts';

interface RequestBody {
  targetEmail: string;
}

serve(async (req: Request) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse the request body
    const body: RequestBody = await req.json();
    const { targetEmail } = body;

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabase = createSupabaseAdmin();

    // Find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: userError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const targetUser = users.users.find(user => user.email === targetEmail);
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found with that email' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user already has the super_admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('platform_roles')
      .select('*')
      .eq('user_id', targetUser.id)
      .eq('role', 'super_admin')
      .single();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = not_found
      console.error('Error checking existing role:', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing role', details: roleCheckError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (existingRole) {
      return new Response(
        JSON.stringify({ message: 'User is already a super admin' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Add the super_admin role to the user
    const { data: newRole, error: insertError } = await supabase
      .from('platform_roles')
      .insert({
        user_id: targetUser.id,
        role: 'super_admin'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error assigning super admin role:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign super admin role', details: insertError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Successfully set ${targetEmail} as super admin`,
        user_id: targetUser.id,
        role: newRole
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
