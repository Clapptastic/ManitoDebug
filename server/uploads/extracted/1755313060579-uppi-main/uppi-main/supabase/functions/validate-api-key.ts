
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createSupabaseAdmin } from './shared/supabase-admin.ts';
import { corsHeaders } from './shared/cors.ts';
import { authenticateUser } from './shared/auth.ts';

interface RequestBody {
  keyType: string;
  apiKey: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    let userId: string;

    try {
      const { user } = await authenticateUser(authHeader);
      userId = user.id;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse the request body
    const body: RequestBody = await req.json();
    const { keyType, apiKey } = body;

    if (!keyType || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'keyType and apiKey are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabase = createSupabaseAdmin();

    // Based on the key type, validate the API key using an appropriate service
    // (this is a simplified example - you would implement specific validation logic)
    let isValid = false;
    let errorMessage = '';

    try {
      // Basic validation - check if key format is correct
      if (apiKey.length < 10) {
        errorMessage = 'API key is too short';
      } else {
        // Mock API key validation - in production, you'd call the actual API service
        isValid = true;
      }

      // Record the validation result in the database
      const timestamp = new Date().toISOString();
      
      // Update the API key record with validation status
      await supabase
        .from('api_keys')
        .update({
          status: isValid ? 'valid' : 'invalid',
          last_validated: timestamp,
          error_message: errorMessage || null
        })
        .eq('key_type', keyType)
        .eq('user_id', userId);

      // Add a status check record
      await supabase
        .from('api_status_checks')
        .insert({
          api_type: keyType,
          status: isValid ? 'valid' : 'invalid',
          user_id: userId,
          last_checked: timestamp,
          error_message: errorMessage || null
        });

      return new Response(
        JSON.stringify({ 
          isValid, 
          errorMessage: errorMessage || null,
          timestamp
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (error) {
      console.error(`Error validating ${keyType} API key:`, error);
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to validate ${keyType} API key`, 
          details: error.message,
          isValid: false
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
