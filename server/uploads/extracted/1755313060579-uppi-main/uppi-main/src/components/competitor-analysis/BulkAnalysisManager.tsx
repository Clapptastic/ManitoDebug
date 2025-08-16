import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SavedAnalysis } from '@/types/competitor-analysis';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { 
  Play, 
  Square, 
  Download, 
  Trash2, 
  RefreshCw,
  CheckSquare,
  Square as SquareIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BulkAnalysisManagerProps {
  analyses: SavedAnalysis[];
  onAnalysesUpdate: () => void;
}

export const BulkAnalysisManager: React.FC<BulkAnalysisManagerProps> = ({
  analyses,
  onAnalysesUpdate
}) => {
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'refresh' | 'delete' | 'export' | null>(null);
  const [actionProgress, setActionProgress] = useState(0);
  const { refreshAnalyses, deleteAnalysis, exportAnalysis } = useCompetitorAnalysis();

  const handleSelectAll = () => {
    if (selectedAnalyses.size === analyses.length) {
      setSelectedAnalyses(new Set());
    } else {
      setSelectedAnalyses(new Set(analyses.map(a => a.id)));
    }
  };

  const handleSelectAnalysis = (analysisId: string) => {
    const newSelected = new Set(selectedAnalyses);
    if (newSelected.has(analysisId)) {
      newSelected.delete(analysisId);
    } else {
      newSelected.add(analysisId);
    }
    setSelectedAnalyses(newSelected);
  };

  const executeBulkAction = async (action: 'refresh' | 'delete' | 'export') => {
    if (selectedAnalyses.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select analyses to perform bulk action',
        variant: 'destructive'
      });
      return;
    }

    setBulkAction(action);
    setActionProgress(0);

    const selectedAnalysisArray = Array.from(selectedAnalyses);
    const total = selectedAnalysisArray.length;
    let completed = 0;

    try {
      for (const analysisId of selectedAnalysisArray) {
        switch (action) {
          case 'refresh':
            await refreshAnalyses();
            break;
          case 'delete':
            await deleteAnalysis(analysisId);
            break;
          case 'export':
            const analysis = analyses.find(a => a.id === analysisId);
            if (analysis) {
              await exportAnalysis({
                format: 'json',
                analysisId: analysis.id
              });
            }
            break;
        }
        
        completed++;
        setActionProgress((completed / total) * 100);
        
        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: 'Bulk Action Complete',
        description: `Successfully ${action}ed ${completed} analysis(es)`,
      });

      setSelectedAnalyses(new Set());
      onAnalysesUpdate();
    } catch (error: any) {
      toast({
        title: 'Bulk Action Failed',
        description: `Failed after ${completed}/${total} operations: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setBulkAction(null);
      setActionProgress(0);
    }
  };

  const getQualityBadge = (analysis: SavedAnalysis) => {
    const score = analysis.data_completeness_score || 0;
    if (score >= 80) return <Badge variant="default">High</Badge>;
    if (score >= 60) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Analysis Manager</span>
          <Badge variant="outline">
            {selectedAnalyses.size} of {analyses.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedAnalyses.size === analyses.length && analyses.length > 0}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeBulkAction('refresh')}
              disabled={selectedAnalyses.size === 0 || bulkAction !== null}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeBulkAction('export')}
              disabled={selectedAnalyses.size === 0 || bulkAction !== null}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => executeBulkAction('delete')}
              disabled={selectedAnalyses.size === 0 || bulkAction !== null}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {bulkAction && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing {bulkAction}...</span>
              <span>{Math.round(actionProgress)}%</span>
            </div>
            <Progress value={actionProgress} className="h-2" />
          </div>
        )}

        {/* Analysis List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                selectedAnalyses.has(analysis.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedAnalyses.has(analysis.id)}
                  onCheckedChange={() => handleSelectAnalysis(analysis.id)}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{analysis.name}</span>
                    {getQualityBadge(analysis)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{analysis.industry || 'Unknown Industry'}</span>
                    <span>•</span>
                    <span>Updated {new Date(analysis.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge 
                  variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {analysis.status}
                </Badge>
                
                {analysis.data_completeness_score && (
                  <span className="text-sm font-medium">
                    {analysis.data_completeness_score}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {analyses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <SquareIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No analyses available for bulk operations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};