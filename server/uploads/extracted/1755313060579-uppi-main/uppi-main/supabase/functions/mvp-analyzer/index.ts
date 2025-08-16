import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { action, ...payload } = await req.json();

    let result;
    
    switch (action) {
      case 'generate_business_model':
        result = await generateBusinessModel(payload);
        break;
      case 'prioritize_features':
        result = await prioritizeFeatures(payload);
        break;
      case 'generate_roadmap':
        result = await generateRoadmap(payload);
        break;
      case 'calculate_resources':
        result = await calculateResources(payload);
        break;
      case 'validate_mvp':
        result = await validateMVP(payload);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mvp-analyzer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateBusinessModel({ idea, targetMarket }: any) {
  // AI-powered business model generation logic
  // This would integrate with OpenAI or other AI services
  return {
    value_propositions: [
      `Solve key pain point for ${targetMarket}`,
      `Provide unique value through ${idea}`,
      'Deliver superior customer experience'
    ],
    customer_segments: [
      targetMarket,
      'Early adopters',
      'Growth-oriented users'
    ],
    channels: [
      'Digital marketing',
      'Social media',
      'Direct sales',
      'Partner networks'
    ],
    revenue_streams: [
      'Subscription model',
      'Transaction fees',
      'Premium features',
      'Professional services'
    ],
    key_resources: [
      'Technology platform',
      'User data',
      'Brand recognition',
      'Team expertise'
    ],
    key_activities: [
      'Product development',
      'Customer acquisition',
      'Data analysis',
      'Customer support'
    ],
    key_partnerships: [
      'Technology providers',
      'Distribution partners',
      'Industry experts',
      'Investor network'
    ],
    cost_structure: [
      'Development costs',
      'Marketing expenses',
      'Operations overhead',
      'Customer acquisition'
    ]
  };
}

async function prioritizeFeatures({ features, criteria }: any) {
  // MoSCoW prioritization algorithm
  const prioritizedFeatures = features.map((feature: any) => {
    let score = 0;
    
    // Impact scoring
    if (feature.impact === 'high') score += 3;
    else if (feature.impact === 'medium') score += 2;
    else score += 1;
    
    // Effort scoring (inverse - lower effort = higher priority)
    if (feature.effort === 'low') score += 3;
    else if (feature.effort === 'medium') score += 2;
    else score += 1;
    
    // Determine priority based on score
    let priority;
    if (score >= 5) priority = 'must-have';
    else if (score >= 4) priority = 'should-have';
    else if (score >= 3) priority = 'could-have';
    else priority = 'wont-have';
    
    return {
      ...feature,
      priority,
      score
    };
  });

  // Sort by score (highest first)
  return prioritizedFeatures.sort((a: any, b: any) => b.score - a.score);
}

async function generateRoadmap({ features, constraints }: any) {
  const roadmapItems = [];
  let currentDate = new Date();
  
  // Sort features by priority
  const sortedFeatures = features.sort((a: any, b: any) => {
    const priorityOrder = { 'must-have': 0, 'should-have': 1, 'could-have': 2, 'wont-have': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group features into sprints (2-week intervals)
  const sprintDuration = 14; // days
  let sprintNumber = 1;
  
  for (let i = 0; i < sortedFeatures.length; i += 3) {
    const sprintFeatures = sortedFeatures.slice(i, i + 3);
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate.getTime() + sprintDuration * 24 * 60 * 60 * 1000);
    
    roadmapItems.push({
      id: `sprint-${sprintNumber}`,
      title: `Sprint ${sprintNumber}`,
      description: `Development sprint focusing on ${sprintFeatures.length} key features`,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      milestone: sprintNumber % 3 === 0, // Every 3rd sprint is a milestone
      features: sprintFeatures.map((f: any) => f.id),
      status: 'pending'
    });
    
    currentDate = new Date(endDate.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day buffer
    sprintNumber++;
  }

  return roadmapItems;
}

async function calculateResources({ features, complexity }: any) {
  let totalHours = 0;
  let developmentHours = 0;
  let designHours = 0;
  let testingHours = 0;

  features.forEach((feature: any) => {
    let baseHours = 0;
    
    // Base hours by effort
    if (feature.effort === 'low') baseHours = 20;
    else if (feature.effort === 'medium') baseHours = 40;
    else baseHours = 80;
    
    // Complexity multiplier
    const complexityMultiplier = {
      'simple': 1,
      'moderate': 1.5,
      'complex': 2.5
    }[complexity] || 1.5;
    
    const featureHours = baseHours * complexityMultiplier;
    
    // Distribute hours across activities
    const devHours = featureHours * 0.6;
    const designHoursForFeature = featureHours * 0.2;
    const testHours = featureHours * 0.2;
    
    developmentHours += devHours;
    designHours += designHoursForFeature;
    testingHours += testHours;
    totalHours += featureHours;
  });

  // Calculate team size and timeline
  const hoursPerWeek = 40;
  const teamSize = Math.max(2, Math.ceil(totalHours / (hoursPerWeek * 12))); // Assume 12-week project
  const timelineWeeks = Math.ceil(totalHours / (hoursPerWeek * teamSize));
  
  // Calculate costs (rough estimates)
  const hourlyRate = 75; // Average hourly rate
  const totalCost = totalHours * hourlyRate;

  return {
    development_hours: Math.round(developmentHours),
    design_hours: Math.round(designHours),
    testing_hours: Math.round(testingHours),
    total_cost: Math.round(totalCost),
    team_size: teamSize,
    timeline_weeks: timelineWeeks
  };
}

async function validateMVP({ project }: any) {
  let viabilityScore = 0;
  let feasibilityScore = 0;
  let desirabilityScore = 0;
  
  const recommendations = [];
  const risks = [];
  const opportunities = [];

  // Viability scoring (business model strength)
  if (project.business_model?.revenue_streams?.length > 0) viabilityScore += 30;
  if (project.business_model?.customer_segments?.length > 0) viabilityScore += 20;
  if (project.budget > 0) viabilityScore += 25;
  if (project.business_model?.value_propositions?.length > 0) viabilityScore += 25;

  // Feasibility scoring (technical implementation)
  const mustHaveFeatures = project.features?.filter((f: any) => f.priority === 'must-have') || [];
  if (mustHaveFeatures.length <= 5) feasibilityScore += 40;
  else if (mustHaveFeatures.length <= 10) feasibilityScore += 25;
  else feasibilityScore += 10;
  
  if (project.roadmap?.length > 0) feasibilityScore += 30;
  if (project.budget > 10000) feasibilityScore += 30;

  // Desirability scoring (market appeal)
  if (project.business_model?.customer_segments?.length >= 2) desirabilityScore += 35;
  if (project.business_model?.value_propositions?.length >= 2) desirabilityScore += 35;
  if (project.business_model?.channels?.length >= 2) desirabilityScore += 30;

  // Generate recommendations
  if (viabilityScore < 70) {
    recommendations.push('Strengthen your business model by defining clear revenue streams');
  }
  if (feasibilityScore < 70) {
    recommendations.push('Reduce scope by focusing on fewer must-have features');
  }
  if (desirabilityScore < 70) {
    recommendations.push('Conduct more market research to validate customer needs');
  }

  // Identify risks
  if (mustHaveFeatures.length > 10) {
    risks.push('Feature scope is too large for an MVP');
  }
  if (project.budget < 5000) {
    risks.push('Budget may be insufficient for proper development');
  }

  // Identify opportunities
  if (viabilityScore > 80) {
    opportunities.push('Strong business model - consider seeking investment');
  }
  if (feasibilityScore > 80 && desirabilityScore > 80) {
    opportunities.push('Well-positioned for rapid development and launch');
  }

  return {
    viability_score: Math.min(100, viabilityScore),
    feasibility_score: Math.min(100, feasibilityScore),
    desirability_score: Math.min(100, desirabilityScore),
    recommendations,
    risks,
    opportunities
  };
}