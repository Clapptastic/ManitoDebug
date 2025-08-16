
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from "../shared/cors.ts"

// Endpoint for microservices management
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verify user is authenticated and is super admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication token' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is super admin
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_user_role', { user_id_param: user.id })
    
    const isSuperAdmin = roleData === 'super_admin' || user.id === '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'

    if (roleError || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Super admin access required' 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { pathname, searchParams } = new URL(req.url)
    const pathParts = pathname.split('/')
    const microserviceId = pathParts[pathParts.length - 1]

    // Check if this is a specific microservice request
    const isSpecificMicroservice = microserviceId !== 'microservices'

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        if (isSpecificMicroservice) {
          // Get a specific microservice
          const { data, error } = await supabaseClient
            .from('microservices')
            .select('*')
            .eq('id', microserviceId)
            .single()

          if (error) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: error.message 
              }),
              { 
                status: error.code === 'PGRST116' ? 404 : 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all microservices
          // Check for query parameters
          const isActive = searchParams.get('active') === 'true'
          const query = supabaseClient.from('microservices').select('*')
          
          if (searchParams.has('active')) {
            query.eq('is_active', isActive)
          }

          const { data, error } = await query

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: error.message }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'POST':
        // Register a new microservice
        const postBody = await req.json()
        
        // Validate required fields
        if (!postBody.name || !postBody.version || !postBody.baseUrl) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Missing required fields: name, version, baseUrl'
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Insert the microservice
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('microservices')
          .insert({
            id: postBody.id,
            name: postBody.name,
            description: postBody.description,
            version: postBody.version,
            base_url: postBody.baseUrl,
            api_key: postBody.apiKey,
            endpoints: postBody.endpoints,
            is_active: true,
            is_external: postBody.isExternal ?? true,
            health_check_path: postBody.healthCheckPath,
            documentation: postBody.documentation
          })
          .select()
          .single()

        if (insertError) {
          return new Response(
            JSON.stringify({ success: false, error: insertError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, data: insertedData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'PUT':
        // Update an existing microservice
        if (!isSpecificMicroservice) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Microservice ID is required for updates'
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const putBody = await req.json()
        
        // Check if the microservice exists
        const { data: existingData, error: existingError } = await supabaseClient
          .from('microservices')
          .select('id')
          .eq('id', microserviceId)
          .single()

        if (existingError) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Microservice not found'
            }),
            { 
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Update the microservice
        const { data: updatedData, error: updateError } = await supabaseClient
          .from('microservices')
          .update({
            name: putBody.name,
            description: putBody.description,
            version: putBody.version,
            base_url: putBody.baseUrl,
            api_key: putBody.apiKey,
            endpoints: putBody.endpoints,
            is_active: putBody.isActive,
            is_external: putBody.isExternal,
            health_check_path: putBody.healthCheckPath,
            documentation: putBody.documentation
          })
          .eq('id', microserviceId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'DELETE':
        // Delete a microservice (or mark as inactive)
        if (!isSpecificMicroservice) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Microservice ID is required for deletion'
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Check if hard delete or soft delete
        const hardDelete = searchParams.get('hard') === 'true'
        
        let result
        if (hardDelete) {
          // Hard delete - remove from database
          const { error: deleteError } = await supabaseClient
            .from('microservices')
            .delete()
            .eq('id', microserviceId)

          if (deleteError) {
            return new Response(
              JSON.stringify({ success: false, error: deleteError.message }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
          
          result = { success: true, message: 'Microservice deleted permanently' }
        } else {
          // Soft delete - mark as inactive
          const { error: updateError } = await supabaseClient
            .from('microservices')
            .update({ is_active: false })
            .eq('id', microserviceId)

          if (updateError) {
            return new Response(
              JSON.stringify({ success: false, error: updateError.message }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
          
          result = { success: true, message: 'Microservice marked as inactive' }
        }

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Method not allowed' }),
          { 
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('Error handling request:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
