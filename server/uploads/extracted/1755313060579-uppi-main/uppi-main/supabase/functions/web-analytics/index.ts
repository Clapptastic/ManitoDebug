
// This Edge Function handles tracking script generation and analytics data collection
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Create Supabase client using environmental variables
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Handler for all web analytics API requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const endpoint = pathParts[pathParts.length - 2]
  const param = pathParts[pathParts.length - 1]

  try {
    // Handle tracking script request: /tracking/:id.js
    if (endpoint === 'tracking' && param.endsWith('.js')) {
      const trackingId = param.replace('.js', '')
      return generateTrackingScript(trackingId)
    }

    // Handle event collection: /collect
    if (endpoint === 'collect') {
      return await handleEventCollection(req)
    }

    // Handle website list: /websites
    if (endpoint === 'websites' && req.method === 'GET') {
      return await listWebsites(req)
    }

    // Handle website creation: /websites (POST)
    if (endpoint === 'websites' && req.method === 'POST') {
      return await createWebsite(req)
    }

    // Handle website details: /websites/:id
    if (endpoint === 'websites' && pathParts.length > 2) {
      const websiteId = pathParts[pathParts.length - 1]
      return await getWebsiteDetails(websiteId, req)
    }

    // Handle metrics: /metrics/:site_id
    if (endpoint === 'metrics' && param !== 'summary') {
      return await getWebsiteMetrics(param, req)
    }

    // Handle summary: /metrics/summary
    if (endpoint === 'metrics' && param === 'summary') {
      return await getSummaryMetrics(req)
    }

    // Handle health check
    if (endpoint === 'health') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Not found
    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { 
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error in web analytics edge function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

// Generate tracking script for a website
function generateTrackingScript(trackingId: string) {
  // Basic tracking script that collects page views
  const script = `
  (function() {
    // Web Analytics Tracking Script v1.0
    const trackingId = "${trackingId}";
    const apiUrl = "${Deno.env.get('SUPABASE_URL')}/functions/v1/web-analytics/collect";
    
    // Generate visitor and session IDs
    function generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // Get visitor ID from localStorage or create a new one
    let visitorId = localStorage.getItem('wa_visitor_id');
    if (!visitorId) {
      visitorId = generateId();
      localStorage.setItem('wa_visitor_id', visitorId);
    }
    
    // Create a new session ID for each visit
    const sessionId = generateId();
    
    // Get browser and device info
    const deviceType = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
    const browser = (function() {
      const ua = navigator.userAgent;
      if (ua.indexOf("Chrome") > -1) return "Chrome";
      if (ua.indexOf("Safari") > -1) return "Safari";
      if (ua.indexOf("Firefox") > -1) return "Firefox";
      if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) return "IE";
      if (ua.indexOf("Edge") > -1) return "Edge";
      return "Unknown";
    })();
    
    // Track page view
    function trackPageView() {
      const startTime = Date.now();
      let hasBounced = true;
      
      // Send page view data
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_id: trackingId,
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          visitor_id: visitorId,
          session_id: sessionId,
          device_type: deviceType,
          browser: browser,
          country: null, // Will be determined server-side
          event_type: 'pageview'
        }),
        keepalive: true
      }).catch(e => console.error('Analytics error:', e));
      
      // Update bounce status when user navigates to another page
      window.addEventListener('beforeunload', function() {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        hasBounced = false;
        
        // Send session data
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracking_id: trackingId,
            page_path: window.location.pathname,
            visitor_id: visitorId,
            session_id: sessionId,
            duration: duration,
            is_bounce: hasBounced,
            event_type: 'session_end'
          }),
          keepalive: true
        }).catch(e => console.error('Analytics error:', e));
      });
    }
    
    // Track custom events
    window.trackAnalyticsEvent = function(name, category, properties = {}) {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_id: trackingId,
          page_path: window.location.pathname,
          visitor_id: visitorId,
          session_id: sessionId,
          event_name: name,
          event_category: category,
          properties: properties,
          event_type: 'custom'
        }),
        keepalive: true
      }).catch(e => console.error('Analytics error:', e));
    };
    
    // Start tracking when the document is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      trackPageView();
    } else {
      document.addEventListener('DOMContentLoaded', trackPageView);
    }
  })();
  `

  return new Response(script, { 
    headers: { 
      'Content-Type': 'application/javascript',
      ...corsHeaders,
      'Cache-Control': 'max-age=3600'
    } 
  })
}

// Handle event collection (page views, custom events, etc.)
async function handleEventCollection(req: Request) {
  // Parse the event data from the request
  const eventData = await req.json()
  const { tracking_id, event_type } = eventData
  
  try {
    // Find the website by tracking_id
    const { data: websiteData, error: websiteError } = await supabaseClient
      .from('analytics_websites')
      .select('id')
      .eq('tracking_id', tracking_id)
      .eq('is_active', true)
      .single()
    
    if (websiteError || !websiteData) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking ID' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    const websiteId = websiteData.id
    
    // Handle different event types
    if (event_type === 'pageview') {
      const { 
        page_path, 
        referrer, 
        visitor_id, 
        session_id,
        device_type,
        browser
      } = eventData
      
      // Insert page view
      const { error: insertError } = await supabaseClient
        .from('analytics_page_views')
        .insert({
          website_id: websiteId,
          page_path,
          referrer,
          visitor_id, 
          session_id,
          device_type,
          browser,
          // Determine country from IP address
          country: await getCountryFromIP(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')),
          is_bounce: true // Initially set to true, will be updated on session_end
        })
      
      if (insertError) {
        throw insertError
      }
    } 
    else if (event_type === 'session_end') {
      const { 
        visitor_id, 
        session_id,
        duration,
        is_bounce 
      } = eventData
      
      // Update the page view with duration and bounce status
      const { error: updateError } = await supabaseClient
        .from('analytics_page_views')
        .update({ 
          duration,
          is_bounce
        })
        .eq('website_id', websiteId)
        .eq('visitor_id', visitor_id)
        .eq('session_id', session_id)
      
      if (updateError) {
        throw updateError
      }
    }
    else if (event_type === 'custom') {
      const { 
        page_path,
        visitor_id, 
        session_id,
        event_name,
        event_category,
        properties
      } = eventData
      
      // Insert custom event
      const { error: insertError } = await supabaseClient
        .from('analytics_events')
        .insert({
          website_id: websiteId,
          page_path,
          visitor_id,
          session_id,
          event_name,
          event_category,
          properties
        })
      
      if (insertError) {
        throw insertError
      }
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error processing analytics event:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to process event' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// List websites for authenticated user
async function listWebsites(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
  
  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Get websites for the authenticated user
    const { data: websites, error: websitesError } = await supabaseClient
      .from('analytics_websites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (websitesError) {
      throw websitesError
    }
    
    return new Response(
      JSON.stringify(websites),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error listing websites:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to list websites' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// Create a new website
async function createWebsite(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
  
  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Parse the request body
    const { name, domain } = await req.json()
    
    // Generate a tracking ID
    const trackingId = 'wa-' + Math.random().toString(36).substring(2, 15)
    
    // Create the website
    const { data: website, error: createError } = await supabaseClient
      .from('analytics_websites')
      .insert({
        name,
        domain,
        tracking_id: trackingId,
        user_id: user.id,
        is_active: true
      })
      .select()
      .single()
    
    if (createError) {
      throw createError
    }
    
    return new Response(
      JSON.stringify(website),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error creating website:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to create website' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// Get website details
async function getWebsiteDetails(websiteId: string, req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
  
  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Get website details
    const { data: website, error: websiteError } = await supabaseClient
      .from('analytics_websites')
      .select('*')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single()
    
    if (websiteError) {
      return new Response(
        JSON.stringify({ error: 'Website not found' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    return new Response(
      JSON.stringify(website),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error getting website details:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to get website details' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// Get website metrics
async function getWebsiteMetrics(websiteId: string, req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
  
  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Get URL parameters for date range
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = url.searchParams.get('end_date') || new Date().toISOString()
    
    // Call the database function to get metrics
    const { data, error } = await supabaseClient.rpc(
      'get_website_metrics',
      { 
        p_website_id: websiteId,
        p_start_date: startDate,
        p_end_date: endDate
      }
    )
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error getting website metrics:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to get website metrics' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// Get summary metrics
async function getSummaryMetrics(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
  
  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Get URL parameters for date range
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = url.searchParams.get('end_date') || new Date().toISOString()
    
    // Call the database function to get summary metrics
    const { data, error } = await supabaseClient.rpc(
      'get_analytics_summary',
      { 
        p_start_date: startDate,
        p_end_date: endDate
      }
    )
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error getting summary metrics:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to get summary metrics' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}

// Helper function to determine country from IP address
async function getCountryFromIP(ip: string | null): Promise<string | null> {
  if (!ip || ip === 'unknown' || ip.startsWith('192.168.') || ip === '127.0.0.1') {
    return null;
  }
  
  try {
    // Use a free IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/country_name/`, {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.ok) {
      const country = await response.text();
      return country.trim() || null;
    }
  } catch (error) {
    console.warn('Failed to get country from IP:', error);
  }
  
  return null;
}
