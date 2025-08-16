import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { competitorAnalysisService } from '@/services/competitorAnalysisService';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  FileText,
  Loader2
} from 'lucide-react';

interface BatchJob {
  id: string;
  competitors: string[];
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  results: any[];
  createdAt: Date;
}

export const CompetitorBatchOperations = () => {
  const [batchInput, setBatchInput] = useState('');
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const [enabledApis] = useState(['openai', 'perplexity']);
  const { toast } = useToast();

  const parseCompetitors = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map(competitor => competitor.trim())
      .filter(competitor => competitor.length > 0);
  };

  const startBatchAnalysis = async () => {
    const competitors = parseCompetitors(batchInput);
    
    if (competitors.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter at least one competitor name',
        variant: 'destructive',
      });
      return;
    }

    const job: BatchJob = {
      id: `batch-${Date.now()}`,
      competitors,
      status: 'running',
      progress: 0,
      results: [],
      createdAt: new Date()
    };

    setCurrentJob(job);

    try {
      // Process competitors in batches of 3 to avoid overwhelming the API
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < competitors.length; i += batchSize) {
        batches.push(competitors.slice(i, i + batchSize));
      }

      let completedCount = 0;
      const allResults: any[] = [];

      for (const batch of batches) {
        if (currentJob?.status === 'paused') {
          break;
        }

        try {
          const batchResults = await competitorAnalysisService.startAnalysis(
            batch.join(','), 
            []
          );
          
          if (batchResults) {
            allResults.push(batchResults);
          }
          completedCount += batch.length;
          
          const progress = (completedCount / competitors.length) * 100;
          
          setCurrentJob(prev => prev ? {
            ...prev,
            progress,
            results: allResults
          } : null);

          // Small delay between batches to be respectful to APIs
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error('Batch processing error:', error);
          // Continue with next batch on error
        }
      }

      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'completed',
        progress: 100,
        results: allResults
      } : null);

      toast({
        title: 'Batch Analysis Complete',
        description: `Successfully analyzed ${allResults.length} out of ${competitors.length} competitors`,
      });

    } catch (error) {
      console.error('Batch analysis failed:', error);
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'failed'
      } : null);
      
      toast({
        title: 'Batch Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const pauseJob = () => {
    setCurrentJob(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const resumeJob = () => {
    setCurrentJob(prev => prev ? { ...prev, status: 'running' } : null);
  };

  const stopJob = () => {
    setCurrentJob(prev => prev ? { ...prev, status: 'completed' } : null);
  };

  const exportResults = () => {
    if (!currentJob?.results.length) return;

    const data = JSON.stringify(currentJob.results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitor-analysis-${currentJob.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Results exported successfully',
    });
  };

  const importCompetitors = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json') {
          const data = JSON.parse(content);
          const competitors = Array.isArray(data) ? data : data.competitors || [];
          setBatchInput(competitors.join('\n'));
        } else {
          // Assume text file with line-separated competitors
          setBatchInput(content);
        }
        
        toast({
          title: 'Import Successful',
          description: 'Competitor list imported successfully',
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Failed to parse the imported file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Batch Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="batch-input">Competitor List</Label>
            <Textarea
              id="batch-input"
              placeholder="Enter competitor names, one per line or comma-separated&#10;Example:&#10;Microsoft&#10;Google&#10;Apple"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={8}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter competitor names separated by commas or new lines
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              id="import-file"
              accept=".txt,.json,.csv"
              onChange={importCompetitors}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import List
            </Button>
            
            {!currentJob && (
              <Button onClick={startBatchAnalysis} disabled={!batchInput.trim()}>
                <Play className="mr-2 h-4 w-4" />
                Start Batch Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Batch Job: {currentJob.id}</span>
              <Badge variant={
                currentJob.status === 'completed' ? 'default' :
                currentJob.status === 'running' ? 'secondary' :
                currentJob.status === 'failed' ? 'destructive' : 'outline'
              }>
                {currentJob.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(currentJob.progress)}%
                </span>
              </div>
              <Progress value={currentJob.progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">
                {currentJob.results.length} of {currentJob.competitors.length} completed
              </p>
            </div>

            <div className="flex gap-2">
              {currentJob.status === 'running' && (
                <>
                  <Button variant="outline" onClick={pauseJob}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button variant="outline" onClick={stopJob}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              
              {currentJob.status === 'paused' && (
                <Button onClick={resumeJob}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              
              {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
                <>
                  <Button variant="outline" onClick={exportResults} disabled={!currentJob.results.length}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Results
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentJob(null)}>
                    Clear Job
                  </Button>
                </>
              )}
            </div>

            {currentJob.status === 'running' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing competitors...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};