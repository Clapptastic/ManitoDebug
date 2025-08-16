
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../shared/cors.ts"

// Serve Swagger UI
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/swagger-ui')[1] || '/'
    
    // Serve the Swagger UI HTML
    if (path === '/' || path === '/index.html') {
      return new Response(generateSwaggerUI(), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
        }
      })
    }
    
    // Return 404 for any other paths
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Error serving Swagger UI:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})

// Function to generate the Swagger UI HTML
function generateSwaggerUI() {
  // Get OpenAPI specification URL from environment variable or use a default
  // In a real deployment, this should be configured properly
  const specUrl = Deno.env.get('OPENAPI_SPEC_URL') || 'https://awiltwjqoafxqwrwvmjy.supabase.co/functions/v1/openapi'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="uppi.ai API Documentation" />
  <title>uppi.ai API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .topbar {
      background-color: #9b87f5;
    }
    .swagger-ui .info .title {
      color: #7E69AB;
    }
    .swagger-ui .btn.execute {
      background-color: #9b87f5;
      border-color: #9b87f5;
    }
    .swagger-ui .btn.execute:hover {
      background-color: #7E69AB;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      border-color: #61affe;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      border-color: #49cc90;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      border-color: #fca130;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      border-color: #f93e3e;
    }
    .swagger-ui .opblock.opblock-patch .opblock-summary {
      border-color: #50e3c2;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 3,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>
  `;
}
