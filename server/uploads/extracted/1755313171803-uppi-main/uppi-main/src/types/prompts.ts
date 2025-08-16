export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  variables: PromptVariable[];
  isSystem: boolean;
  isActive: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  usage_count?: number;
  tags: string[];
}

export interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  example?: string;
}

export type PromptCategory = 
  | 'competitor_analysis'
  | 'market_research' 
  | 'business_planning'
  | 'customer_support'
  | 'content_creation'
  | 'data_analysis'
  | 'general'
  | 'system';

export interface UserPromptConfig {
  id: string;
  user_id: string;
  template_id: string;
  custom_prompt: string;
  variables: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptPreviewRequest {
  template: string;
  variables: Record<string, any>;
  context?: {
    user_data?: any;
    business_context?: any;
  };
}

export interface PromptPreviewResponse {
  rendered_prompt: string;
  token_count: number;
  estimated_cost: number;
  warnings: string[];
}

export interface PromptAnalytics {
  template_id: string;
  usage_count: number;
  success_rate: number;
  average_tokens: number;
  average_cost: number;
  last_used: string;
  popular_variables: Record<string, any>;
}

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100
}

// Default system prompt templates
export const DEFAULT_SYSTEM_PROMPTS: Partial<PromptTemplate>[] = [
  {
    name: 'AI Co-founder Assistant',
    description: 'Comprehensive entrepreneurship guidance and business advice',
    category: 'system',
    template: `You are a helpful co-founder AI assistant that helps entrepreneurs with their business ideas and challenges. 

Your responses should be constructive, actionable, and based on best practices in entrepreneurship.
Keep responses concise and focused on practical next steps.
When discussing technical solutions, provide specific recommendations and best practices.
If the user mentions competitors, incorporate competitive analysis into your response.
For financial questions, focus on practical, actionable advice and common pitfalls to avoid.

{{#if startup_context}}
Current Startup Context:
- Industry: {{startup_context.industry}}
- Stage: {{startup_context.stage}}
- Description: {{startup_context.description}}
{{/if}}

{{#if market_data}}
Market Analysis Context:
- TAM: $\{{market_data.tam}}
- SAM: $\{{market_data.sam}}
- SOM: $\{{market_data.som}}
- Region: {{market_data.region}}
{{/if}}`,
    variables: [
      {
        name: 'startup_context',
        type: 'object',
        description: 'Current startup information',
        required: false,
        example: '{ "industry": "SaaS", "stage": "MVP", "description": "AI-powered analytics" }'
      },
      {
        name: 'market_data',
        type: 'object', 
        description: 'Market size analysis data',
        required: false,
        example: '{ "tam": "1000000000", "sam": "100000000", "som": "10000000" }'
      }
    ],
    isSystem: true,
    isActive: true,
    tags: ['entrepreneurship', 'business', 'default']
  },
  {
    name: 'Competitor Analysis Expert',
    description: 'Specialized prompts for competitive intelligence and market analysis',
    category: 'competitor_analysis',
    // Synchronized with supabase/functions/competitor-analysis/index.ts (OpenAI messages)
    // SINGLE SOURCE OF TRUTH (mirrors the active system+user prompts used by the edge function)
    template: `System (role): You are a senior competitive intelligence analyst with access to comprehensive business databases. You must provide verifiable data with specific source citations and direct URLs for every data point. Always cite your sources with direct links to the original content.

User: Analyze the company "{{company_name}}" and return ONLY valid JSON with comprehensive competitive intelligence data AND specific source citations for each data point.

CRITICAL REQUIREMENT: For every piece of information you provide, you must include the specific URL where you found that data. Include a "source_citations" array with detailed source information.

Structure your response exactly as follows:

{
  "company_name": string,
  "legal_entity": string | null,
  "website_url": string | null,
  "founded_year": number | null,
  "headquarters": string | null,
  "employee_count": number | null,
  "founders_bios": string[] | null,
  "mission_statement": string | null,
  "vision_statement": string | null,
  "company_values": string[] | null,
  "funding_history": { "rounds": array, "total_funding": string, "investors": string[] } | null,
  "public_private_status": "public" | "private" | null,
  "major_milestones": array | null,
  "main_products_services": string[] | null,
  "product_categories": string[] | null,
  "unique_selling_proposition": string | null,
  "product_roadmap": string[] | null,
  "technology_stack": string[] | null,
  "product_features": string[] | null,
  "service_delivery_model": "in-person" | "digital" | "hybrid" | null,
  "bundled_services": string[] | null,
  "product_lifecycle_stage": "intro" | "growth" | "maturity" | "decline" | null,
  "product_availability": { "regions": string[], "channels": string[] } | null,
  "certifications": string[] | null,
  "accessibility_compliance": boolean | null,
  "user_onboarding_process": string | null,
  "customization_options": string[] | null,
  "warranties_guarantees": string[] | null,
  "target_customer_segments": string[] | null,
  "target_demographics": object | null,
  "customer_psychographics": object | null,
  "geographic_markets": string[] | null,
  "market_share_percentage": number | null,
  "brand_perception": string | null,
  "niche_focus": string | null,
  "loyalty_programs": string[] | null,
  "pricing_sensitivity": string | null,
  "key_partnerships": string[] | null,
  "pricing_strategy": { "model": string, "ranges": object, "discounts": string[] } | null,
  "subscription_model": boolean | null,
  "freemium_model": boolean | null,
  "average_revenue_per_customer": string | null,
  "payment_methods": string[] | null,
  "seasonal_pricing": boolean | null,
  "refund_policy": string | null,
  "ancillary_revenue": string[] | null,
  "sales_approach": string[] | null,
  "distribution_networks": string[] | null,
  "ecommerce_presence": object | null,
  "marketplace_usage": string[] | null,
  "wholesale_channels": string[] | null,
  "licensing_agreements": string[] | null,
  "franchise_model": boolean | null,
  "global_distribution": string | null,
  "supply_chain_model": string | null,
  "sales_volume_trends": string | null,
  "brand_identity": { "logo": string, "colors": string[], "tagline": string } | null,
  "brand_voice": string | null,
  "social_media_presence": { "platforms": object, "engagement": object } | null,
  "influencer_partnerships": string[] | null,
  "advertising_campaigns": string[] | null,
  "content_marketing": { "blogs": boolean, "videos": boolean, "whitepapers": boolean } | null,
  "seo_performance": string | null,
  "email_marketing": string | null,
  "pr_coverage": string | null,
  "sponsorships": string[] | null,
  "thought_leadership": string[] | null,
  "online_reviews": { "average_rating": number, "review_count": number } | null,
  "visual_consistency": string | null,
  "brand_sentiment": string | null,
  "proprietary_technology": string[] | null,
  "rd_investment": { "percentage": string, "focus_areas": string[] } | null,
  "ai_adoption": string | null,
  "innovation_cycles": string | null,
  "system_integrations": string[] | null,
  "annual_revenue": string | null,
  "revenue_growth_rate": string | null,
  "profit_margins": { "gross": string, "operating": string, "net": string } | null,
  "ebitda": string | null,
  "customer_acquisition_cost": string | null,
  "customer_lifetime_value": string | null,
  "break_even_analysis": string | null,
  "capital_expenditure": string | null,
  "customer_support": { "channels": string[], "response_time": string } | null,
  "customer_satisfaction": { "csat": number, "nps": number } | null,
  "retention_rate": string | null,
  "churn_rate": string | null,
  "return_rate": string | null,
  "onboarding_quality": string | null,
  "case_studies": string[] | null,
  "service_personalization": string | null,
  "operational_weaknesses": string[] | null,
  "negative_press": string[] | null,
  "supplier_dependency": string[] | null,
  "regulatory_challenges": string[] | null,
  "market_vulnerabilities": string[] | null,
  "industry": string | null,
  "description": string | null,
  "business_model": string | null,
  "target_market": string[] | null,
  "market_position": "leader" | "challenger" | "follower" | "niche" | null,
  "strengths": string[],
  "weaknesses": string[],
  "opportunities": string[],
  "threats": string[],
  "competitive_advantages": string[] | null,
  "technology_analysis": string | null,
  "market_position_performance": {
    "market_share_percentage": number,
    "market_growth_rate": string,
    "competitive_ranking": number,
    "market_trends": string[],
    "performance_metrics": {
      "revenue_growth": string,
      "customer_acquisition": string,
      "market_penetration": string,
      "brand_recognition": string
    },
    "competitive_advantages": string[],
    "market_challenges": string[],
    "future_outlook": string
  },
  "technology_innovation": {
    "innovation_score": number,
    "technology_stack": {
      "frontend": string[],
      "backend": string[],
      "databases": string[],
      "infrastructure": string[],
      "ai_ml": string[]
    },
    "patents_ip": {
      "patent_count": number,
      "key_innovations": string[],
      "ip_strategy": string
    },
    "rd_investment": {
      "percentage_of_revenue": string,
      "focus_areas": string[],
      "recent_breakthroughs": string[]
    },
    "innovation_culture": {
      "innovation_labs": boolean,
      "partnerships": string[],
      "open_source": boolean
    }
  },
  "customer_journey_analysis": {
    "awareness_stage": {
      "discovery_channels": string[],
      "brand_touchpoints": string[],
      "content_strategy": string,
      "seo_presence": string
    },
    "consideration_stage": {
      "evaluation_criteria": string[],
      "comparison_factors": string[],
      "trial_options": string[],
      "sales_process": string
    },
    "purchase_stage": {
      "onboarding_process": string,
      "payment_options": string[],
      "implementation_time": string,
      "support_during_setup": string
    },
    "retention_stage": {
      "success_metrics": string[],
      "engagement_tactics": string[],
      "loyalty_programs": string[],
      "churn_prevention": string[]
    },
    "advocacy_stage": {
      "referral_programs": string[],
      "customer_success_stories": string[],
      "community_building": string,
      "user_generated_content": string
    }
  },
  "products_and_services": {
    "product_features": {
      "core_features": string[],
      "user_experience_quality": "excellent" | "good" | "average" | "poor",
      "design_quality": "excellent" | "good" | "average" | "poor",
      "feature_depth": string,
      "innovation_level": string
    },
    "pricing_analysis": {
      "pricing_model": string,
      "competitive_pricing_position": "premium" | "competitive" | "budget" | "value",
      "base_prices": object,
      "pricing_transparency": string,
      "value_proposition": string
    },
    "customer_service": {
      "support_channels": string[],
      "response_times": object,
      "service_quality_rating": number,
      "availability": string,
      "support_quality": string
    }
  },
  "marketing_and_sales": {
    "marketing_channels": {
      "primary_channels": string[],
      "channel_effectiveness": object
    },
    "social_media_presence": {
      "platforms": string[],
      "social_media_strength": string,
      "engagement_rates": object
    },
    "sales_tactics": {
      "lead_generation_methods": string[],
      "sales_approach": string,
      "sales_cycle_length": string,
      "conversion_strategies": string[]
    }
  },
  "business_operations": {
    "market_share": {
      "competitive_position": string,
      "estimated_market_share": string,
      "market_ranking": string,
      "market_growth_rate": string
    },
    "financial_performance": {
      "funding_status": string,
      "profitability": string,
      "financial_health": string
    },
    "technology_stack": {
      "core_technologies": string[],
      "infrastructure": string,
      "technology_advantages": string[]
    },
    "customer_journey": {
      "awareness_stage": string,
      "purchase_process": string,
      "retention_strategies": string[]
    }
  },
  "source_citations": Array<{ "field": string, "source": string, "url"?: string, "confidence"?: number }>,
  "confidence": Record<string, number>,
  "data_quality_score": number | null,
  "analysis_method": string | null,
  "analyzed_at": string | null
}

Provide detailed analysis for ALL sections. For missing data, make reasonable estimates based on industry standards and clearly indicate uncertainty in confidence scores. Focus on actionable competitive intelligence.`,
    variables: [
      {
        name: 'company_name',
        type: 'text',
        description: 'Name of the company to analyze',
        required: true,
        example: 'Tesla Inc.'
      },
      {
        name: 'analysis_depth',
        type: 'text',
        description: 'Level of analysis detail',
        required: false,
        defaultValue: 'comprehensive',
        example: 'comprehensive | overview | focused'
      },
      {
        name: 'focus_areas',
        type: 'array',
        description: 'Specific areas to focus the analysis on',
        required: false,
        example: '["technology", "market share", "pricing strategy"]'
      }
    ],
    isSystem: false,
    isActive: true,
    tags: ['competitive intelligence', 'analysis', 'research']
  }
];
