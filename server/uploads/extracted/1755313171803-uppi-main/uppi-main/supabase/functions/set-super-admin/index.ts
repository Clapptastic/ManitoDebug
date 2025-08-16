import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body if it exists
    let targetEmail = 'akclapp@gmail.com'; // Default email
    if (req.body) {
      try {
        const body = await req.json();
        if (body?.targetEmail) {
          targetEmail = body.targetEmail;
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
        // Use default email if parsing fails
      }
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`Setting up super admin for email: ${targetEmail}`);

    // Find the user by email in auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const targetUser = users.users.find(user => user.email === targetEmail);
    
    if (!targetUser) {
      console.error('User not found with email:', targetEmail);
      return new Response(
        JSON.stringify({ error: 'User not found with that email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Found user:', { id: targetUser.id, email: targetUser.email });

    // Check if user already has super_admin role
    const { data: existingRole, error: roleCheckError } = await supabaseAdmin
      .from('platform_roles')
      .select('*')
      .eq('user_id', targetUser.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking existing role:', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing role', details: roleCheckError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingRole) {
      console.log('User is already a super admin');
      return new Response(
        JSON.stringify({ message: 'User is already a super admin', success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign super_admin role to the user
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('platform_roles')
      .insert([
        { user_id: targetUser.id, role: 'super_admin' },
      ])
      .select();

    if (roleError) {
      console.error('Failed to assign super admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign super admin role', details: roleError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully assigned super admin role:', roleData);
    return new Response(
      JSON.stringify({ 
        message: `Super admin role assigned to ${targetEmail} successfully`,
        success: true,
        role: roleData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Internal server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});