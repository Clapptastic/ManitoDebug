import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { nanoid } from 'nanoid';

interface CompetitorAnalysisFormProps {
  onAnalyze: (competitors: string[], sessionId: string) => void;
  loading: boolean;
  apiStatuses?: Record<string, any>;
  enabledApis?: string[];
  progress?: number;
}

export const CompetitorAnalysisForm = ({ 
  onAnalyze, 
  loading, 
  apiStatuses = {}, 
  enabledApis: propsEnabledApis = [], 
  progress = 0 
}: CompetitorAnalysisFormProps) => {
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [enabledApis, setEnabledApis] = useState<string[]>(propsEnabledApis);

  const addCompetitor = () => {
    const trimmed = competitorInput.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (competitors.length > 0 && (enabledApis.length > 0 || hasWorkingApis)) {
      const sessionId = nanoid();
      onAnalyze(competitors, sessionId);
    }
  };

  const toggleApi = (api: string, enabled: boolean) => {
    setEnabledApis(enabled 
      ? [...enabledApis, api] 
      : enabledApis.filter(a => a !== api)
    );
  };

  const workingApis = Object.keys(apiStatuses).filter(api => apiStatuses[api]?.isWorking);
  const hasWorkingApis = workingApis.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Analysis</CardTitle>
        {!hasWorkingApis && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4 dark:bg-amber-950/20 dark:border-amber-900/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              🔑 API keys required for competitor analysis. <Link to="/api-keys" className="underline font-medium hover:text-amber-900">Set up your API keys</Link> to get started.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="competitor-input">Add Competitors</Label>
            <div className="flex gap-2">
              <Input
                id="competitor-input"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                placeholder="Enter competitor name (e.g., Nike, Adidas)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
              />
              <Button type="button" onClick={addCompetitor} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {competitors.map((competitor, index) => (
                  <div key={index} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-md">
                    <span className="text-sm">{competitor}</span>
                    <Button
                      type="button"
                      onClick={() => removeCompetitor(index)}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>AI Providers</Label>
            <div className="space-y-2">
              {Object.entries(apiStatuses).map(([api, status]) => (
                <div key={api} className="flex items-center space-x-2">
                  <Checkbox
                    id={api}
                    checked={enabledApis.includes(api)}
                    onCheckedChange={(checked) => toggleApi(api, !!checked)}
                    disabled={!status?.isWorking}
                  />
                  <Label htmlFor={api} className={!status?.isWorking ? 'text-muted-foreground' : ''}>
                    {api.charAt(0).toUpperCase() + api.slice(1)}
                    {!status?.isWorking && ' (Not configured)'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {loading && progress !== undefined && (
            <div className="space-y-2 mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Analyzing competitors... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || competitors.length === 0 || !hasWorkingApis || (hasWorkingApis && enabledApis.length === 0)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              `Analyze ${competitors.length} Competitor${competitors.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};