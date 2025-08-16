import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ComprehensiveAnalysisButtonProps {
  analysisId: string;
  companyName: string;
  onAnalysisComplete?: () => void;
  disabled?: boolean;
  /** Optional: limit analysis to these providers; forwarded to proxy and stored in progress metadata */
  providersSelected?: string[];
}

export const ComprehensiveAnalysisButton: React.FC<ComprehensiveAnalysisButtonProps> = ({
  analysisId,
  companyName,
  onAnalysisComplete,
  disabled = false,
  providersSelected
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleComprehensiveAnalysis = async () => {
    try {
      setIsLoading(true);
      // Generate session and pre-create progress so pipeline can update it
      const sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `analysis-${Date.now()}`;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Gating preflight: ensure user is unlocked (admins bypass)
      const { data: gateData, error: gateError } = await supabase.functions.invoke('competitor-analysis-gate', {
        body: { action: 'check', providersSelected }
      });
      if (gateError) throw new Error(gateError.message);
      if (!gateData?.can_proceed) {
        toast({
          title: 'Feature Locked',
          description: (gateData?.reasons?.[0]) || 'Run System Test to unlock competitor analysis.',
          variant: 'destructive'
        });
        return; // Skip running analysis if not allowed
      }

      await supabase.rpc('insert_competitor_analysis_progress', {
        session_id_param: sessionId,
        user_id_param: user.id,
        total_competitors_param: 1,
        metadata_param: { competitors: [companyName], providersSelected }
      });

      const { data, error } = await supabase.functions.invoke('comprehensive-competitor-analysis', {
        body: {
          sessionId,
          action: 'start',
          competitors: [companyName],
          providersSelected
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Comprehensive analysis failed');

      const resultsCount = Array.isArray(data?.results) ? data.results.length : 0;

      toast({
        title: 'Analysis Enhanced',
        description: `Comprehensive analysis completed for ${companyName}. ${resultsCount} result(s) processed.`,
      });

      onAnalysisComplete?.();
    } catch (error: any) {
      console.error('Comprehensive analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to enhance analysis',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComprehensiveAnalysis}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Brain className="h-4 w-4" />
      )}
      {isLoading ? 'Enhancing...' : 'Enhance Analysis'}
    </Button>
  );
};