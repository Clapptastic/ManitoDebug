import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubWorkflow {
  id: number
  name: string
  state: string
  badge_url: string
  html_url: string
  created_at: string
  updated_at: string
}

interface GitHubWorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string
  workflow_id: number
  created_at: string
  updated_at: string
  html_url: string
  head_branch: string
  head_sha: string
}

interface DependabotAlert {
  number: number
  state: string
  dependency: {
    package: {
      ecosystem: string
      name: string
    }
    manifest_path: string
  }
  security_advisory: {
    ghsa_id: string
    cve_id: string
    summary: string
    description: string
    severity: string
    published_at: string
  }
  security_vulnerability: {
    package: {
      ecosystem: string
      name: string
    }
    vulnerable_version_range: string
    first_patched_version: {
      identifier: string
    }
  }
  url: string
  html_url: string
  created_at: string
  updated_at: string
}

interface DependabotPullRequest {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: {
    login: string
    type: string
  }
  labels: Array<{
    name: string
    color: string
  }>
}

interface GitHubIntegrationRequest {
  action: 'workflows' | 'workflow-runs' | 'dependabot-alerts' | 'dependabot-prs' | 'package-json'
  owner?: string
  repo?: string
  workflow_id?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, owner, repo, workflow_id }: GitHubIntegrationRequest = await req.json()

    // For demo purposes, we'll use hardcoded values. In production, these would come from environment variables
    const GITHUB_OWNER = owner || 'your-org'
    const GITHUB_REPO = repo || 'your-repo'
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')

    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'GitHub token not configured',
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const githubHeaders = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lovable-Admin-Dashboard'
    }

    let response
    let data

    switch (action) {
      case 'workflows':
        console.log('Fetching GitHub workflows...')
        response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`,
          { headers: githubHeaders }
        )
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
        }
        
        data = await response.json()
        const workflows: GitHubWorkflow[] = data.workflows || []
        
        return new Response(
          JSON.stringify({ workflows, success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'workflow-runs':
        console.log('Fetching GitHub workflow runs...')
        const runsUrl = workflow_id 
          ? `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflow_id}/runs`
          : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs`
        
        response = await fetch(`${runsUrl}?per_page=10&page=1`, { headers: githubHeaders })
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
        }
        
        data = await response.json()
        const workflowRuns: GitHubWorkflowRun[] = data.workflow_runs || []
        
        return new Response(
          JSON.stringify({ workflow_runs: workflowRuns, success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'dependabot-alerts':
        console.log('Fetching Dependabot alerts...')
        response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dependabot/alerts?state=open&per_page=50`,
          { headers: githubHeaders }
        )
        
        if (!response.ok) {
          if (response.status === 404) {
            // Repository might not have Dependabot enabled or no alerts
            return new Response(
              JSON.stringify({ alerts: [], success: true, message: 'No Dependabot alerts or Dependabot not enabled' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
        }
        
        const alerts: DependabotAlert[] = await response.json()
        
        return new Response(
          JSON.stringify({ alerts, success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'dependabot-prs':
        console.log('Fetching Dependabot pull requests...')
        response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open&per_page=50`,
          { headers: githubHeaders }
        )
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
        }
        
        const allPrs = await response.json()
        const dependabotPrs: DependabotPullRequest[] = allPrs.filter((pr: any) => 
          pr.user?.login === 'dependabot[bot]' || pr.user?.type === 'Bot'
        )
        
        return new Response(
          JSON.stringify({ pull_requests: dependabotPrs, success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'package-json':
        console.log('Fetching package.json...')
        response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/package.json`,
          { headers: githubHeaders }
        )
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
        }
        
        data = await response.json()
        const packageJson = JSON.parse(atob(data.content))
        
        return new Response(
          JSON.stringify({ package_json: packageJson, success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action specified',
            success: false 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Error in github-integration function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})