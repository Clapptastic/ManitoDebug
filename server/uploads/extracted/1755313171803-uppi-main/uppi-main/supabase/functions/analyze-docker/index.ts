import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DockerAnalysisRequest {
  dockerfileContent: string;
  serviceName?: string;
  additionalFiles?: { [filename: string]: string };
}

interface DockerAnalysis {
  serviceName: string;
  baseImage: string;
  exposedPorts: number[];
  environment: { [key: string]: string };
  volumes: string[];
  commands: string[];
  dependencies: string[];
  integrationDocumentation: string;
  endpoints: {
    path: string;
    method: string;
    description: string;
    parameters?: any[];
    responses?: any[];
  }[];
  healthCheckEndpoint?: string;
  configurationTemplate: any;
  deploymentInstructions: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Require authenticated user (JWT)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dockerfileContent, serviceName, additionalFiles } = await req.json() as DockerAnalysisRequest;

    if (!dockerfileContent) {
      return new Response(
        JSON.stringify({ error: 'Dockerfile content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing Dockerfile...');
    
    // Parse Dockerfile
    const dockerAnalysis = analyzeDockerfile(dockerfileContent);
    
    // Extract additional documentation from files if provided
    if (additionalFiles) {
      const extractedDocs = extractDocumentationFromFiles(additionalFiles);
      dockerAnalysis.integrationDocumentation += '\n\n' + extractedDocs;
      
      // Look for API definitions
      const apiEndpoints = extractAPIEndpoints(additionalFiles);
      dockerAnalysis.endpoints = [...dockerAnalysis.endpoints, ...apiEndpoints];
    }

    // Generate comprehensive integration documentation
    const integrationDoc = generateIntegrationDocumentation(dockerAnalysis, serviceName);
    
    // Generate configuration template
    const configTemplate = generateConfigurationTemplate(dockerAnalysis);
    
    // Generate deployment instructions
    const deploymentInstructions = generateDeploymentInstructions(dockerAnalysis);

    const result: DockerAnalysis = {
      ...dockerAnalysis,
      serviceName: serviceName || dockerAnalysis.serviceName || 'unknown-service',
      integrationDocumentation: integrationDoc,
      configurationTemplate: configTemplate,
      deploymentInstructions: deploymentInstructions
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-docker function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function analyzeDockerfile(content: string): Partial<DockerAnalysis> {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  
  const analysis: Partial<DockerAnalysis> = {
    baseImage: '',
    exposedPorts: [],
    environment: {},
    volumes: [],
    commands: [],
    dependencies: [],
    endpoints: []
  };

  for (const line of lines) {
    const [command, ...args] = line.split(' ');
    const argsString = args.join(' ');

    switch (command.toUpperCase()) {
      case 'FROM':
        analysis.baseImage = argsString;
        break;
      
      case 'EXPOSE':
        const ports = argsString.split(' ').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
        analysis.exposedPorts!.push(...ports);
        break;
      
      case 'ENV':
        const envParts = argsString.split('=');
        if (envParts.length === 2) {
          analysis.environment![envParts[0].trim()] = envParts[1].trim();
        }
        break;
      
      case 'VOLUME':
        analysis.volumes!.push(argsString.replace(/[\[\]"']/g, ''));
        break;
      
      case 'RUN':
        analysis.commands!.push(argsString);
        // Extract package installations
        if (argsString.includes('npm install') || argsString.includes('yarn add') || argsString.includes('pip install')) {
          analysis.dependencies!.push(argsString);
        }
        break;
      
      case 'CMD':
      case 'ENTRYPOINT':
        analysis.commands!.push(`${command}: ${argsString}`);
        break;
    }
  }

  // Infer service name from base image or commands
  if (!analysis.serviceName) {
    if (analysis.baseImage!.includes('node')) {
      analysis.serviceName = 'node-service';
    } else if (analysis.baseImage!.includes('python')) {
      analysis.serviceName = 'python-service';
    } else if (analysis.baseImage!.includes('nginx')) {
      analysis.serviceName = 'nginx-service';
    } else {
      analysis.serviceName = 'generic-service';
    }
  }

  return analysis;
}

function extractDocumentationFromFiles(files: { [filename: string]: string }): string {
  let documentation = '';
  
  for (const [filename, content] of Object.entries(files)) {
    const lowerFilename = filename.toLowerCase();
    
    // Extract from common documentation files
    if (lowerFilename.includes('readme') || lowerFilename.includes('doc') || lowerFilename.endsWith('.md')) {
      documentation += `\n\n## ${filename}\n${content}`;
    }
    
    // Extract from package.json
    if (lowerFilename === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        documentation += `\n\n## Package Information\n`;
        documentation += `Name: ${pkg.name}\n`;
        documentation += `Version: ${pkg.version}\n`;
        documentation += `Description: ${pkg.description}\n`;
        if (pkg.scripts) {
          documentation += `Scripts: ${Object.keys(pkg.scripts).join(', ')}\n`;
        }
        if (pkg.dependencies) {
          documentation += `Dependencies: ${Object.keys(pkg.dependencies).join(', ')}\n`;
        }
      } catch (e) {
        console.warn('Failed to parse package.json:', e);
      }
    }
    
    // Extract from requirements.txt
    if (lowerFilename === 'requirements.txt') {
      documentation += `\n\n## Python Requirements\n${content}`;
    }
  }
  
  return documentation;
}

function extractAPIEndpoints(files: { [filename: string]: string }): any[] {
  const endpoints: any[] = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const lowerFilename = filename.toLowerCase();
    
    // Look for OpenAPI/Swagger specs
    if (lowerFilename.includes('swagger') || lowerFilename.includes('openapi') || lowerFilename.endsWith('.yaml') || lowerFilename.endsWith('.yml')) {
      try {
        // Simple YAML parsing for endpoints (basic implementation)
        const lines = content.split('\n');
        let currentPath = '';
        
        for (const line of lines) {
          if (line.trim().startsWith('/')) {
            currentPath = line.trim().replace(':', '');
          } else if (line.trim().match(/^(get|post|put|delete|patch):/)) {
            const method = line.trim().replace(':', '').toUpperCase();
            endpoints.push({
              path: currentPath,
              method: method,
              description: `${method} ${currentPath}`,
              parameters: [],
              responses: []
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse API spec:', e);
      }
    }
    
    // Look for code files with route definitions
    if (lowerFilename.endsWith('.js') || lowerFilename.endsWith('.ts') || lowerFilename.endsWith('.py')) {
      // Simple regex to find common route patterns
      const routePatterns = [
        /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
        /@(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
        /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g
      ];
      
      for (const pattern of routePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          endpoints.push({
            path: match[2],
            method: match[1].toUpperCase(),
            description: `${match[1].toUpperCase()} ${match[2]}`,
            parameters: [],
            responses: []
          });
        }
      }
    }
  }
  
  return endpoints;
}

function generateIntegrationDocumentation(analysis: Partial<DockerAnalysis>, serviceName?: string): string {
  const name = serviceName || analysis.serviceName || 'Unknown Service';
  
  let doc = `# ${name} Integration Documentation\n\n`;
  
  doc += `## Service Overview\n`;
  doc += `- **Service Name**: ${name}\n`;
  doc += `- **Base Image**: ${analysis.baseImage}\n`;
  doc += `- **Exposed Ports**: ${analysis.exposedPorts?.join(', ') || 'None'}\n`;
  doc += `- **Health Check**: ${analysis.healthCheckEndpoint || '/health (inferred)'}\n\n`;
  
  doc += `## Environment Variables\n`;
  if (Object.keys(analysis.environment || {}).length > 0) {
    for (const [key, value] of Object.entries(analysis.environment!)) {
      doc += `- **${key}**: ${value}\n`;
    }
  } else {
    doc += `No environment variables defined in Dockerfile.\n`;
  }
  doc += `\n`;
  
  doc += `## API Endpoints\n`;
  if (analysis.endpoints && analysis.endpoints.length > 0) {
    for (const endpoint of analysis.endpoints) {
      doc += `### ${endpoint.method} ${endpoint.path}\n`;
      doc += `${endpoint.description}\n\n`;
    }
  } else {
    doc += `No API endpoints detected. Add API documentation manually.\n\n`;
  }
  
  doc += `## Dependencies\n`;
  if (analysis.dependencies && analysis.dependencies.length > 0) {
    for (const dep of analysis.dependencies) {
      doc += `- ${dep}\n`;
    }
  } else {
    doc += `No package dependencies detected in Dockerfile.\n`;
  }
  doc += `\n`;
  
  doc += `## Volumes\n`;
  if (analysis.volumes && analysis.volumes.length > 0) {
    for (const volume of analysis.volumes) {
      doc += `- ${volume}\n`;
    }
  } else {
    doc += `No volumes defined.\n`;
  }
  doc += `\n`;
  
  doc += `## Integration Instructions\n`;
  doc += `1. **Build the Docker image**:\n`;
  doc += `   \`\`\`bash\n   docker build -t ${name.toLowerCase()} .\n   \`\`\`\n\n`;
  
  doc += `2. **Run the container**:\n`;
  doc += `   \`\`\`bash\n   docker run -d --name ${name.toLowerCase()} \\\\\n`;
  if (analysis.exposedPorts && analysis.exposedPorts.length > 0) {
    doc += `     -p ${analysis.exposedPorts[0]}:${analysis.exposedPorts[0]} \\\\\n`;
  }
  if (Object.keys(analysis.environment || {}).length > 0) {
    for (const [key, value] of Object.entries(analysis.environment!)) {
      doc += `     -e ${key}="${value}" \\\\\n`;
    }
  }
  doc += `     ${name.toLowerCase()}\n   \`\`\`\n\n`;
  
  doc += `3. **Register with the platform**:\n`;
  doc += `   - Add to microservices registry\n`;
  doc += `   - Configure health checks\n`;
  doc += `   - Set up monitoring\n\n`;
  
  doc += `## AI Coding Agent Instructions\n`;
  doc += `Copy and paste this entire documentation to your AI coding agent for full integration support.\n`;
  doc += `The agent should have all necessary information to integrate this microservice into the platform.\n`;
  
  return doc;
}

function generateConfigurationTemplate(analysis: Partial<DockerAnalysis>): any {
  return {
    name: analysis.serviceName,
    display_name: analysis.serviceName?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Dockerized microservice based on ${analysis.baseImage}`,
    base_url: `http://localhost:${analysis.exposedPorts?.[0] || 3000}`,
    version: '1.0.0',
    status: 'active',
    health_check_url: `http://localhost:${analysis.exposedPorts?.[0] || 3000}/health`,
    docker_config: {
      base_image: analysis.baseImage,
      exposed_ports: analysis.exposedPorts,
      environment: analysis.environment,
      volumes: analysis.volumes,
      commands: analysis.commands
    },
    endpoints: analysis.endpoints?.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description
    })) || []
  };
}

function generateDeploymentInstructions(analysis: Partial<DockerAnalysis>): string {
  let instructions = `# Deployment Instructions\n\n`;
  
  instructions += `## Prerequisites\n`;
  instructions += `- Docker installed and running\n`;
  instructions += `- Access to the platform's microservices registry\n\n`;
  
  instructions += `## Deployment Steps\n`;
  instructions += `1. Build and tag the Docker image\n`;
  instructions += `2. Push to container registry (if using remote registry)\n`;
  instructions += `3. Update platform configuration\n`;
  instructions += `4. Deploy to target environment\n`;
  instructions += `5. Verify health checks\n`;
  instructions += `6. Update load balancer configuration\n\n`;
  
  instructions += `## Monitoring\n`;
  instructions += `- Health check endpoint: ${analysis.healthCheckEndpoint || '/health'}\n`;
  instructions += `- Exposed ports: ${analysis.exposedPorts?.join(', ') || 'None specified'}\n`;
  instructions += `- Log collection: Configure based on application framework\n`;
  
  return instructions;
}