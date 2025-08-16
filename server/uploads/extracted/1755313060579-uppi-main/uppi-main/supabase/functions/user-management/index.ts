import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin or super admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const isAdmin = userRole?.role === 'admin' || userRole?.role === 'super_admin'
    const isSuperAdmin = user.email === 'akclapp@gmail.com' || user.email === 'samdyer27@gmail.com'
    
    if (!isAdmin && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...data } = await req.json()

    switch (action) {
      case 'list_users':
        // Get all auth users
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        if (authError) throw authError

        // Get profiles and roles
        const { data: profiles } = await supabaseAdmin.from('profiles').select('*')
        const { data: roles } = await supabaseAdmin.from('user_roles').select('*').eq('is_active', true)

        // Combine data
        const users = authUsers.users.map(authUser => {
          const profile = profiles?.find(p => p.user_id === authUser.id)
          const userRole = roles?.find(r => r.user_id === authUser.id)
          
          return {
            id: authUser.id,
            email: authUser.email,
            full_name: profile?.full_name || authUser.user_metadata?.full_name,
            avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
            role: userRole?.role || profile?.role || 'user',
            status: authUser.app_metadata?.suspended ? 'suspended' : 
                   !authUser.email_confirmed_at ? 'inactive' : 'active',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at,
            last_active_at: profile?.last_active_at
          }
        })

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'create_user':
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { full_name: data.full_name }
        })
        
        if (createError) throw createError

        // Create profile for the new user
        if (newUser.user) {
          await supabaseAdmin.from('profiles').insert({
            user_id: newUser.user.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role || 'user'
          })

          // Create user role entry if role is specified
          if (data.role && data.role !== 'user') {
            await supabaseAdmin.from('user_roles').insert({
              user_id: newUser.user.id,
              role: data.role,
              assigned_by: user.id,
              is_active: true
            })
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'suspend_user':
        const { error: suspendError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
          app_metadata: { suspended: true }
        })
        
        if (suspendError) throw suspendError

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'update_user':
        // Update user metadata
        if (data.userData.full_name !== undefined || data.userData.role !== undefined) {
          const updateData: any = {}
          if (data.userData.full_name !== undefined) {
            updateData.user_metadata = { full_name: data.userData.full_name }
          }
          
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, updateData)
          if (updateError) throw updateError
        }

        // Update profile
        const profileUpdates: any = {}
        if (data.userData.full_name !== undefined) profileUpdates.full_name = data.userData.full_name
        if (data.userData.role !== undefined) profileUpdates.role = data.userData.role

        if (Object.keys(profileUpdates).length > 0) {
          await supabaseAdmin.from('profiles').upsert({
            user_id: data.userId,
            ...profileUpdates,
            updated_at: new Date().toISOString()
          })
        }

        // Update user role if specified
        if (data.userData.role) {
          // Deactivate existing roles
          await supabaseAdmin.from('user_roles').update({ is_active: false }).eq('user_id', data.userId)

          // Create new role if not default user role
          if (data.userData.role !== 'user') {
            await supabaseAdmin.from('user_roles').insert({
              user_id: data.userId,
              role: data.userData.role,
              assigned_by: user.id,
              is_active: true
            })
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'delete_user':
        if (!isSuperAdmin) {
          return new Response(JSON.stringify({ error: 'Only super admins can permanently delete users' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Delete from auth and related tables will cascade
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userId)
        if (deleteError) throw deleteError

        // Clean up related data
        await supabaseAdmin.from('profiles').delete().eq('user_id', data.userId)
        await supabaseAdmin.from('user_roles').delete().eq('user_id', data.userId)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('Error in user-management function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})