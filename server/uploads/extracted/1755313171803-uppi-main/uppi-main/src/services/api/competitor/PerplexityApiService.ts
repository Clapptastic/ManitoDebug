
/**
 * Perplexity API Service
 * This service handles API calls to Perplexity's API for competitor analysis
 */
import { ApiServiceBase } from "../core/ApiServiceBase";
import { CompetitorAnalysis } from "@/types/competitor";
import { supabase } from "@/integrations/supabase/client";
import { competitorAnalysisService } from "@/services/competitorAnalysisService"; // Use unified provider selection

export class PerplexityApiService extends ApiServiceBase {
  protected apiProvider = 'perplexity';
  
  constructor() {
    super();
  }

  protected getApiName(): string {
    return 'perplexity';
  }

  protected getBaseUrl(): string {
    return 'https://api.perplexity.ai';
  }
  
  /**
   * Analyze a competitor using Perplexity API
   * @param competitor The competitor name to analyze
   * @param estimatedCost The estimated cost of the API call
   */
  async analyzeCompetitor(
    competitor: string,
    estimatedCost: number = 0.02
  ): Promise<Partial<CompetitorAnalysis>> {
    if (!competitor) {
      throw new Error("Competitor name is required");
    }

    const prompt = `Analyze the company "${competitor}" and provide a detailed analysis in JSON format.`;
    
    try {
      const response = await this.executeApiCall<any>(
        'competitor-analysis',
        async () => {
          const selectedProviders = await competitorAnalysisService.getAvailableProviders();
          const { data, error } = await supabase.functions.invoke('competitor-analysis', {
            body: {
              action: 'start',
              competitors: [competitor],
              providersSelected: selectedProviders,
              sessionId: `perplexity-${Date.now()}`,
            },
          });
          if (error) throw error;
          return data;
        },
        { competitor }
      );
      
      // Process and format the response
      const analysisResult = this.processPerplexityResponse(response, competitor);
      return analysisResult;
    } catch (error) {
      console.error(`[PerplexityApiService] Error analyzing competitor: ${competitor}`, error);
      throw error;
    }
  }
  
  /**
   * Process and format the Perplexity API response
   */
  private processPerplexityResponse(
    response: any,
    competitor: string
  ): Partial<CompetitorAnalysis> {
    if (!response) {
      throw new Error('Invalid response from competitor-analysis function');
    }
    
    // competitor-analysis returns { success, sessionId, results }
    const results = (response as any)?.results || {};
    const firstKey = Object.keys(results)[0];
    const content = firstKey ? results[firstKey]?.data || results[firstKey] : response;

    try {
      if (typeof content === 'string') {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/```\n([\s\S]*?)\n```/) ||
                          content.match(/{[\s\S]*?}/);
        let parsedData;
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          parsedData = { competitor_name: competitor, company_overview: content, status: 'completed' };
        }
        return {
          name: parsedData.name || parsedData.competitor_name || competitor,
          status: 'completed',
          analysis_data: {
            features: parsedData.features || [],
            products: parsedData.products || parsedData.product_offerings || [],
            market_share: parsedData.market_share || 0,
            growth_stage: parsedData.growth_stage || '',
            market_position: parsedData.market_position || '',
            api_source: 'perplexity',
            confidence_score: 0.7,
          },
        };
      }

      // If it's already structured
      return {
        name: competitor,
        status: 'completed',
        analysis_data: { ...content, api_source: 'perplexity', confidence_score: 0.7 },
      };
    } catch (error) {
      console.error('Error processing Perplexity response:', error);
      return {
        name: competitor,
        status: 'failed',
        analysis_data: { error: error instanceof Error ? error.message : 'Error processing response' },
      };
    }
  }
}

export default PerplexityApiService;
