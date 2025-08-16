import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { useTrendAnalysis } from '@/hooks/useTrendAnalysis';

interface TrendAnalysisFormProps {
  onAnalysisComplete?: (results: string) => void;
}

export const TrendAnalysisForm: React.FC<TrendAnalysisFormProps> = ({ onAnalysisComplete }) => {
  const [industry, setIndustry] = useState('');
  const [timeframe, setTimeframe] = useState('6 months');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const { analyzeTrends, isLoading, results, error } = useTrendAnalysis();

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await analyzeTrends({
      industry: industry.trim() || undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      timeframe
    });

    if (result?.success && onAnalysisComplete) {
      onAnalysisComplete(result.insights);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          AI Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="industry">Industry (Optional)</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>

          <div>
            <Label htmlFor="timeframe">Analysis Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3 months">3 months</SelectItem>
                <SelectItem value="6 months">6 months</SelectItem>
                <SelectItem value="12 months">12 months</SelectItem>
                <SelectItem value="24 months">24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="keywords">Focus Keywords (Optional)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder="Add keywords to focus the analysis"
              />
              <Button type="button" onClick={handleAddKeyword} size="sm">
                Add
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Trends...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Trends
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analysis Results
            </h4>
            <div className="text-sm whitespace-pre-wrap">{results}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};