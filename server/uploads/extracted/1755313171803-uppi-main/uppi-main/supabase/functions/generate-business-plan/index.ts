import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      projectData,
      userId,
      planType = 'lean_canvas' 
    } = await req.json();

    console.log('Generating business plan for:', projectData);

    const businessPlan = await generateBusinessPlan(projectData, planType);
    
    // Store in database
    const { data: savedPlan, error } = await supabase
      .from('business_plans')
      .insert({
        user_id: userId,
        title: `${projectData.name || 'Untitled'} Business Plan`,
        industry: projectData.industry,
        business_model: businessPlan.businessModel,
        plan_data: businessPlan,
        financial_projections: businessPlan.financialProjections,
        status: 'draft',
        template_used: planType,
        metadata: {
          generatedAt: new Date().toISOString(),
          projectData: projectData
        }
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        businessPlan: businessPlan,
        planId: savedPlan.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating business plan:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateBusinessPlan(projectData: any, planType: string) {
  const businessPlan = {
    executiveSummary: {
      overview: `${projectData.name} is an innovative ${projectData.industry} solution addressing key market needs.`,
      mission: `To revolutionize ${projectData.industry} through innovative technology and user-centric design.`,
      vision: `To become the leading platform in ${projectData.industry} market segment.`,
      objectives: [
        'Launch MVP within 6 months',
        'Acquire 1000 early adopters',
        'Achieve product-market fit',
        'Secure Series A funding'
      ]
    },
    
    marketAnalysis: {
      industryOverview: `The ${projectData.industry} industry is experiencing rapid growth with increasing demand for digital solutions.`,
      targetMarket: projectData.targetMarket || [
        'Small to medium businesses',
        'Tech-savvy professionals',
        'Digital natives'
      ],
      marketSize: {
        tam: '$50B', // Total Addressable Market
        sam: '$5B',  // Serviceable Addressable Market
        som: '$500M' // Serviceable Obtainable Market
      },
      competitiveAnalysis: {
        directCompetitors: [],
        indirectCompetitors: [],
        competitiveAdvantage: [
          'First-mover advantage',
          'Superior user experience',
          'Advanced technology stack'
        ]
      }
    },

    businessModel: {
      valueProposition: projectData.valueProposition || 'Innovative solution that saves time and increases efficiency',
      revenueStreams: [
        'Subscription fees (SaaS)',
        'Premium features',
        'Enterprise licensing',
        'Professional services'
      ],
      costStructure: [
        'Technology development',
        'Marketing and sales',
        'Operations and support',
        'General and administrative'
      ],
      keyPartners: [
        'Technology providers',
        'Integration partners',
        'Channel partners',
        'Strategic investors'
      ]
    },

    productDevelopment: {
      currentState: 'Concept/Planning',
      mvpFeatures: projectData.features || [
        'Core functionality',
        'User authentication',
        'Basic dashboard',
        'Essential integrations'
      ],
      roadmap: {
        phase1: 'MVP Development (0-6 months)',
        phase2: 'Market Validation (6-12 months)',
        phase3: 'Scale and Growth (12-24 months)'
      },
      technology: {
        frontend: 'React/TypeScript',
        backend: 'Node.js/Supabase',
        database: 'PostgreSQL',
        hosting: 'Cloud-based'
      }
    },

    marketingStrategy: {
      channels: [
        'Digital marketing',
        'Content marketing',
        'Social media',
        'Partnership marketing'
      ],
      customerAcquisition: {
        strategies: [
          'SEO/Content marketing',
          'Paid advertising',
          'Referral programs',
          'Industry events'
        ],
        cac: '$50', // Customer Acquisition Cost
        ltv: '$500' // Customer Lifetime Value
      },
      brandingPositioning: 'Premium, innovative, user-friendly solution'
    },

    operationsManagement: {
      teamStructure: {
        founders: 1,
        developers: 2,
        marketing: 1,
        sales: 1
      },
      keyOperations: [
        'Product development',
        'Customer support',
        'Sales and marketing',
        'Quality assurance'
      ],
      qualityControl: 'Automated testing, user feedback, continuous monitoring'
    },

    financialProjections: {
      year1: {
        revenue: 100000,
        expenses: 150000,
        netIncome: -50000,
        customers: 100
      },
      year2: {
        revenue: 500000,
        expenses: 400000,
        netIncome: 100000,
        customers: 500
      },
      year3: {
        revenue: 1500000,
        expenses: 1000000,
        netIncome: 500000,
        customers: 1500
      },
      fundingRequirements: {
        seedRound: 250000,
        seriesA: 2000000,
        useOfFunds: [
          'Product development (40%)',
          'Marketing and sales (30%)',
          'Team expansion (20%)',
          'Operations (10%)'
        ]
      }
    },

    riskAnalysis: {
      marketRisks: [
        'Market adoption slower than expected',
        'Competitive pressure',
        'Economic downturn'
      ],
      technicalRisks: [
        'Development delays',
        'Technical challenges',
        'Scalability issues'
      ],
      financialRisks: [
        'Funding shortfall',
        'Higher than expected costs',
        'Cash flow challenges'
      ],
      mitigationStrategies: [
        'Agile development approach',
        'Strong team and advisors',
        'Conservative financial planning',
        'Diversified revenue streams'
      ]
    },

    implementation: {
      milestones: [
        {
          milestone: 'MVP Completion',
          timeline: '3 months',
          kpis: ['Feature completion', 'User testing']
        },
        {
          milestone: 'Beta Launch',
          timeline: '4 months',
          kpis: ['User signups', 'Feedback scores']
        },
        {
          milestone: 'Public Launch',
          timeline: '6 months',
          kpis: ['Revenue targets', 'Customer acquisition']
        }
      ],
      successMetrics: [
        'Monthly Recurring Revenue (MRR)',
        'Customer Acquisition Cost (CAC)',
        'Customer Lifetime Value (LTV)',
        'Net Promoter Score (NPS)'
      ]
    }
  };

  return businessPlan;
}