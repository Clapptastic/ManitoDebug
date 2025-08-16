import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeneratePDFRequest {
  analysisId: string
  format: 'basic' | 'comprehensive' | 'executive'
  includeCharts?: boolean
  customSections?: string[]
}

serve(async (req) => {
  console.log('🚀 Edge function started - generate-analysis-pdf');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Creating Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'Unknown error'}`);
    }

    const requestBody = await req.json() as GeneratePDFRequest;
    console.log('📋 PDF Generation Request:', requestBody);

    // Fetch the analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', requestBody.analysisId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !analysis) {
      throw new Error(`Failed to fetch analysis: ${fetchError?.message || 'Analysis not found'}`);
    }

    console.log('📊 Generating PDF for analysis:', analysis.name);

    // Generate PDF content based on format
    const pdfData = await generatePDFContent(analysis, requestBody);

    // Log the PDF generation event
    await supabase.from('api_usage_costs').insert({
      user_id: user.id,
      api_provider: 'internal',
      endpoint: 'generate-analysis-pdf',
      success: true,
      metadata: {
        analysis_id: requestBody.analysisId,
        format: requestBody.format,
        analysis_name: analysis.name
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: pdfData,
        message: 'PDF generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate PDF'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generatePDFContent(analysis: any, request: GeneratePDFRequest) {
  console.log(`📄 Generating ${request.format} PDF for ${analysis.name}`);
  
  const sections = [];
  
  // Header Information
  sections.push({
    type: 'header',
    title: `Competitor Analysis: ${analysis.name}`,
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    metadata: {
      dataQuality: analysis.data_completeness_score || 'N/A',
      status: analysis.status,
      lastUpdated: analysis.updated_at
    }
  });

  // Executive Summary
  if (analysis.description || request.format === 'executive') {
    sections.push({
      type: 'executive_summary',
      title: 'Executive Summary',
      content: analysis.description || 'No executive summary available.',
      keyMetrics: {
        marketPosition: analysis.market_position,
        threatLevel: analysis.overall_threat_level,
        dataQuality: analysis.data_completeness_score,
        employeeCount: analysis.employee_count
      }
    });
  }

  // Company Overview
  sections.push({
    type: 'company_overview',
    title: 'Company Overview',
    data: {
      'Company Name': analysis.name,
      'Industry': analysis.industry || 'N/A',
      'Founded': analysis.founded_year || 'N/A',
      'Headquarters': analysis.headquarters || 'N/A',
      'Employees': analysis.employee_count ? analysis.employee_count.toLocaleString() : 'N/A',
      'Website': analysis.website_url || 'N/A',
      'Business Model': analysis.business_model || 'N/A',
      'Market Position': analysis.market_position || 'N/A'
    }
  });

  // Financial Overview (if comprehensive format)
  if (request.format === 'comprehensive' && (analysis.revenue_estimate || analysis.market_share_estimate)) {
    sections.push({
      type: 'financial_overview',
      title: 'Financial Overview',
      data: {
        'Revenue Estimate': analysis.revenue_estimate ? `$${analysis.revenue_estimate.toLocaleString()}` : 'N/A',
        'Market Share': analysis.market_share_estimate ? `${analysis.market_share_estimate}%` : 'N/A',
        'Funding Information': analysis.funding_info ? JSON.stringify(analysis.funding_info) : 'N/A'
      }
    });
  }

  // SWOT Analysis
  if (analysis.strengths || analysis.weaknesses || analysis.opportunities || analysis.threats) {
    sections.push({
      type: 'swot_analysis',
      title: 'SWOT Analysis',
      data: {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        opportunities: analysis.opportunities || [],
        threats: analysis.threats || []
      }
    });
  }

  // Competitive Analysis
  if (analysis.competitive_advantages || analysis.competitive_disadvantages) {
    sections.push({
      type: 'competitive_analysis',
      title: 'Competitive Analysis',
      data: {
        advantages: analysis.competitive_advantages || [],
        disadvantages: analysis.competitive_disadvantages || [],
        threatLevel: analysis.overall_threat_level || 'Medium'
      }
    });
  }

  // Market Analysis (if comprehensive format)
  if (request.format === 'comprehensive') {
    sections.push({
      type: 'market_analysis',
      title: 'Market Analysis',
      data: {
        'Target Markets': (analysis.target_market || []).join(', ') || 'N/A',
        'Customer Segments': (analysis.customer_segments || []).join(', ') || 'N/A',
        'Geographic Presence': (analysis.geographic_presence || []).join(', ') || 'N/A',
        'Market Trends': (analysis.market_trends || []).join(', ') || 'N/A',
        'Partnerships': (analysis.partnerships || []).join(', ') || 'N/A'
      }
    });
  }

  // Technology & Innovation (if comprehensive format)
  if (request.format === 'comprehensive' && (analysis.technology_analysis || analysis.patent_count)) {
    sections.push({
      type: 'technology_analysis',
      title: 'Technology & Innovation',
      data: {
        'Innovation Score': analysis.innovation_score || 'N/A',
        'Patent Count': analysis.patent_count || 'N/A',
        'Technology Stack': analysis.technology_analysis ? JSON.stringify(analysis.technology_analysis) : 'N/A',
        'Certifications': (analysis.certification_standards || []).join(', ') || 'N/A'
      }
    });
  }

  // Performance Scores
  if (request.format === 'comprehensive') {
    const scores = [];
    if (analysis.innovation_score) scores.push(['Innovation', analysis.innovation_score]);
    if (analysis.brand_strength_score) scores.push(['Brand Strength', analysis.brand_strength_score]);
    if (analysis.operational_efficiency_score) scores.push(['Operational Efficiency', analysis.operational_efficiency_score]);
    if (analysis.market_sentiment_score) scores.push(['Market Sentiment', analysis.market_sentiment_score]);
    if (analysis.data_quality_score) scores.push(['Data Quality', analysis.data_quality_score]);

    if (scores.length > 0) {
      sections.push({
        type: 'performance_scores',
        title: 'Performance Scores',
        scores: scores
      });
    }
  }

  // Data Sources & Methodology
  if (analysis.source_citations || analysis.api_responses) {
    sections.push({
      type: 'methodology',
      title: 'Data Sources & Methodology',
      data: {
        'Data Sources': analysis.source_citations ? 'Multiple AI providers and public sources' : 'Public sources',
        'Last Updated': analysis.last_updated_sources || analysis.updated_at,
        'Confidence Level': analysis.confidence_scores ? 'High' : 'Medium',
        'API Providers': analysis.api_responses ? Object.keys(analysis.api_responses).join(', ') : 'N/A'
      }
    });
  }

  return {
    title: `${analysis.name} - Competitor Analysis Report`,
    format: request.format,
    generatedAt: new Date().toISOString(),
    sections: sections,
    metadata: {
      analysisId: analysis.id,
      companyName: analysis.name,
      totalSections: sections.length,
      dataQualityScore: analysis.data_completeness_score
    }
  };
}