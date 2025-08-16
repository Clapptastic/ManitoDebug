import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CompetitorAnalysisResult } from '@/services/competitorAnalysisService';
import { AdvancedExportDialog } from './AdvancedExportDialog';
import { OutboundLink } from '@/components/shared/OutboundLink';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  BarChart3, 
  Users, 
  Building,
  Globe,
  Calendar,
  DollarSign,
  Save,
  Download,
  FileText
} from 'lucide-react';

interface CompetitorAnalysisResultsProps {
  results: CompetitorAnalysisResult[];
  onSave?: (name: string, description: string) => Promise<void>;
  canSave?: boolean;
  isLoading?: boolean;
}

export const CompetitorAnalysisResults: React.FC<CompetitorAnalysisResultsProps> = ({
  results,
  onSave,
  canSave = true,
  isLoading = false
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState(0);

  const handleSave = async () => {
    if (!saveName.trim() || !onSave) return;
    
    try {
      await onSave(saveName, saveDescription);
      setSaveDialogOpen(false);
      setSaveName('');
      setSaveDescription('');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
          <p className="text-muted-foreground">
            Start an analysis to see competitive intelligence results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentResult = results[selectedCompetitor];

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <p className="text-muted-foreground">
            {results.length} competitor{results.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export Options */}
          <AdvancedExportDialog
            analysis={currentResult as any}
            trigger={
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Analysis
              </Button>
            }
          />
          
          {canSave && onSave && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Analysis
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="save-name">Analysis Name</Label>
                <Input
                  id="save-name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter analysis name..."
                />
              </div>
              <div>
                <Label htmlFor="save-description">Description (Optional)</Label>
                <Textarea
                  id="save-description"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Describe this analysis..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!saveName.trim() || isLoading}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Competitor Selection */}
      {results.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Competitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.map((result, index) => (
                <Button
                  key={index}
                  variant={selectedCompetitor === index ? 'default' : 'outline'}
                  onClick={() => setSelectedCompetitor(index)}
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  {result.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Competitor Analysis */}
      {currentResult && (
        <div className="space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {currentResult.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentResult.market_position && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Market Position</p>
                    <Badge variant="secondary">{currentResult.market_position}</Badge>
                  </div>
                )}
                {currentResult.employee_count && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Employees</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{currentResult.employee_count.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {currentResult.founded_year && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Founded</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{currentResult.founded_year}</span>
                    </div>
                  </div>
                )}
                {currentResult.website_url && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <OutboundLink 
                        href={currentResult.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Visit Site
                      </OutboundLink>
                    </div>
                  </div>
                )}
              </div>
              
              {currentResult.description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{currentResult.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Tabs */}
          <Tabs defaultValue="swot" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
              <TabsTrigger value="market">Market Data</TabsTrigger>
              <TabsTrigger value="business">Business Model</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="swot" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-success flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentResult.strengths?.length > 0 ? (
                      <ul className="space-y-2">
                        {currentResult.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No strengths identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentResult.weaknesses?.length > 0 ? (
                      <ul className="space-y-2">
                        {currentResult.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No weaknesses identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-warning flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentResult.opportunities?.length > 0 ? (
                      <ul className="space-y-2">
                        {currentResult.opportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No opportunities identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Threats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Threats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentResult.threats?.length > 0 ? (
                      <ul className="space-y-2">
                        {currentResult.threats.map((threat, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            {threat}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No threats identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="market" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentResult.industry && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Industry</p>
                        <p className="font-medium">{currentResult.industry}</p>
                      </div>
                    )}
                    {currentResult.target_market?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Target Market</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentResult.target_market.map((market, index) => (
                            <Badge key={index} variant="outline">{market}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentResult.headquarters && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Headquarters</p>
                        <p className="font-medium">{currentResult.headquarters}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentResult.data_quality_score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Data Quality</span>
                          <span className={`text-sm font-medium ${getScoreColor(currentResult.data_quality_score)}`}>
                            {currentResult.data_quality_score}%
                          </span>
                        </div>
                        <Progress value={currentResult.data_quality_score} className="h-2" />
                      </div>
                    )}
                    {currentResult.data_completeness_score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Data Completeness</span>
                          <span className={`text-sm font-medium ${getScoreColor(currentResult.data_completeness_score)}`}>
                            {currentResult.data_completeness_score}%
                          </span>
                        </div>
                        <Progress value={currentResult.data_completeness_score} className="h-2" />
                      </div>
                    )}
                    {currentResult.market_sentiment_score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Market Sentiment</span>
                          <span className={`text-sm font-medium ${getScoreColor(currentResult.market_sentiment_score)}`}>
                            {currentResult.market_sentiment_score}%
                          </span>
                        </div>
                        <Progress value={currentResult.market_sentiment_score} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Model Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentResult.business_model && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Business Model</p>
                      <p className="font-medium">{currentResult.business_model}</p>
                    </div>
                  )}
                  
                  {currentResult.pricing_strategy && Object.keys(currentResult.pricing_strategy).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Pricing Strategy</p>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <pre className="text-sm">{JSON.stringify(currentResult.pricing_strategy, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {currentResult.funding_info && Object.keys(currentResult.funding_info).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Funding Information</p>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <pre className="text-sm">{JSON.stringify(currentResult.funding_info, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult.insights?.length > 0 ? (
                    <div className="space-y-3">
                      {currentResult.insights.map((insight, index) => (
                        <div key={index} className="border-l-4 border-primary pl-4 py-2">
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No AI insights available for this competitor.</p>
                  )}
                  
                  {currentResult.recommendations?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {currentResult.recommendations.map((recommendation, index) => (
                          <div key={index} className="border-l-4 border-warning pl-4 py-2 bg-warning/5">
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};