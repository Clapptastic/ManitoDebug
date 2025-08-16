import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Link2, 
  TrendingUp, 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Download,
  Upload,
  Sparkles,
  Clock,
  BarChart3,
  Brain,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMasterProfileIntegration } from '@/hooks/useMasterProfileIntegration';

interface EnhancedMasterProfileIntegrationProps {
  analysisId: string;
  companyName: string;
  website?: string;
  industry?: string;
  onDataEnrichment?: (enrichedData: any) => void;
  onProfileLinked?: (masterProfileId: string) => void;
}

export const EnhancedMasterProfileIntegration: React.FC<EnhancedMasterProfileIntegrationProps> = ({
  analysisId,
  companyName,
  website,
  industry,
  onDataEnrichment,
  onProfileLinked
}) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    masterProfile,
    matchResult,
    enrichmentData,
    insights,
    dataQuality,
    isLoading,
    isEnriching,
    isContributing,
    error,
    hasMatch,
    isHighConfidenceMatch,
    canEnrich,
    canContribute,
    findMasterProfileMatch,
    enrichAnalysis,
    contributeToMasterProfile,
    getMasterProfileInsights,
    enhanceWithAI,
    assessDataQuality
  } = useMasterProfileIntegration(analysisId, companyName, website, industry);

  useEffect(() => {
    if (hasMatch && matchResult && onProfileLinked) {
      onProfileLinked(matchResult.masterProfileId);
    }
  }, [hasMatch, matchResult, onProfileLinked]);

  useEffect(() => {
    if (enrichmentData && onDataEnrichment) {
      onDataEnrichment(enrichmentData);
    }
  }, [enrichmentData, onDataEnrichment]);

  const handleEnrichAnalysis = async () => {
    if (!matchResult) return;
    
    setEnrichmentProgress(0);
    const interval = setInterval(() => {
      setEnrichmentProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await enrichAnalysis(matchResult.masterProfileId);
      if (result) {
        setEnrichmentProgress(100);
        toast({
          title: "Analysis Enriched",
          description: "Your analysis has been enhanced with master profile data",
        });
      }
    } finally {
      clearInterval(interval);
      setTimeout(() => setEnrichmentProgress(0), 2000);
    }
  };

  const handleContributeData = async () => {
    if (!matchResult) return;

    const result = await contributeToMasterProfile(matchResult.masterProfileId, 'selective');
    if (result.success) {
      toast({
        title: "Data Contributed",
        description: `Contributed ${result.contributionsApplied} data points to master profile`,
      });
    }
  };

  const handleGetInsights = async () => {
    if (!matchResult) return;

    const result = await getMasterProfileInsights(matchResult.masterProfileId, {
      focusAreas: ['competitive_positioning', 'market_trends'],
      analysisType: 'competitor_analysis'
    });

    if (result) {
      toast({
        title: "AI Insights Generated",
        description: `Generated ${result.insights.length} strategic insights`,
      });
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!matchResult) return;

    const success = await enhanceWithAI(matchResult.masterProfileId, [
      'data_validation',
      'gap_filling',
      'trend_analysis'
    ]);

    if (success) {
      await findMasterProfileMatch();
    }
  };

  const handleAssessQuality = async () => {
    if (!matchResult) return;
    
    await assessDataQuality(matchResult.masterProfileId);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <CardTitle className="text-lg">Master Profile Integration</CardTitle>
          </div>
          <CardDescription>Searching for authoritative company data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing company data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Integration Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => findMasterProfileMatch()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasMatch) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Master Profile Integration</CardTitle>
          </div>
          <CardDescription>
            No master profile found - contribute to build authoritative company data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              This company hasn't been analyzed before. Your analysis will help create
              the first comprehensive master profile.
            </p>
            <Button 
              onClick={() => {
                // Trigger creation of new master profile
                toast({
                  title: "Creating Master Profile",
                  description: "Your analysis will be used to create the first master profile",
                });
              }}
              className="mt-2"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create Master Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Master Profile Connected</CardTitle>
            <Badge variant={isHighConfidenceMatch ? "default" : "secondary"}>
              {Math.round((matchResult?.matchConfidence || 0) * 100)}% Match
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
        <CardDescription>
          Connected to authoritative company data with AI-enhanced insights
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enrichment Progress */}
        {enrichmentProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Enriching with AI insights...
              </span>
              <span>{enrichmentProgress}%</span>
            </div>
            <Progress value={enrichmentProgress} className="h-2" />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {masterProfile?.overall_confidence_score || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {masterProfile?.data_completeness_score || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Completeness</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-600">
              {masterProfile?.source_analyses?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Sources</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleEnrichAnalysis}
            disabled={!canEnrich || isEnriching}
          >
            {isEnriching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Enrich Analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleContributeData}
            disabled={!canContribute || isContributing}
          >
            {isContributing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Contribute Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGetInsights}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEnhanceWithAI}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Enhance with AI
          </Button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <div className="font-medium">{masterProfile?.company_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <div className="font-medium">{masterProfile?.industry || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div className="font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {masterProfile?.updated_at ? new Date(masterProfile.updated_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Validation:</span>
                  <Badge variant="outline" className="ml-2">
                    {masterProfile?.validation_status || 'pending'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Match Criteria:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {matchResult?.matchCriteria.map((criteria) => (
                    <Badge key={criteria} variant="secondary" className="text-xs">
                      {criteria.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enrichment" className="space-y-4">
              {enrichmentData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enrichment Status</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Data Freshness:</span>
                      <span className="ml-2 font-medium">{enrichmentData.dataFreshness}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sources:</span>
                      <span className="ml-2 font-medium">{enrichmentData.enrichmentSources.length} analyses</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="ml-2 font-medium">{enrichmentData.confidenceScore}%</span>
                    </div>
                  </div>

                  {enrichmentData.suggestedUpdates && enrichmentData.suggestedUpdates.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Suggested Updates:</span>
                      <ul className="text-xs space-y-1">
                        {enrichmentData.suggestedUpdates.map((update, index) => (
                          <li key={index} className="flex items-start">
                            <TrendingUp className="h-3 w-3 mr-2 mt-0.5 text-blue-500" />
                            {update}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No enrichment data available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleEnrichAnalysis}
                  >
                    Start Enrichment
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {insights ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Insights</span>
                    <Badge variant="default">
                      {insights.insights?.length || 0} Generated
                    </Badge>
                  </div>

                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Recommendations:</span>
                      <ul className="text-xs space-y-1">
                        {insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <Brain className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.dataGaps && insights.dataGaps.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Data Gaps:</span>
                      <ul className="text-xs space-y-1">
                        {insights.dataGaps.map((gap: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 text-amber-500" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No AI insights generated yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleGetInsights}
                  >
                    Generate Insights
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              {dataQuality ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Quality Assessment</span>
                    <Badge variant="default">
                      {dataQuality.overallScore}% Score
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(dataQuality.categoryScores || {}).map(([category, score]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category.replace('_', ' ')}:</span>
                        <span className="font-medium">{typeof score === 'number' ? score : 0}%</span>
                      </div>
                    ))}
                  </div>

                  {dataQuality.missingFields && dataQuality.missingFields.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Missing Fields:</span>
                      <div className="flex flex-wrap gap-1">
                        {dataQuality.missingFields.map((field: string) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No quality assessment available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleAssessQuality}
                  >
                    Assess Quality
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedMasterProfileIntegration;