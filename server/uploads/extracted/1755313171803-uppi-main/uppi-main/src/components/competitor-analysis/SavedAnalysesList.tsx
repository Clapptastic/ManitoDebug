/**
 * SINGLE SOURCE OF TRUTH: Saved Analyses List
 * Supports a modern visual variant via delegation.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SavedAnalysis } from '@/services/competitorAnalysisService';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { 
  MoreVertical, 
  Download, 
  RefreshCw, 
  Trash2, 
  Edit,
  Calendar,
  Building,
  BarChart3,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Removed ModernSavedAnalysesList import - consolidated into this component

interface SavedAnalysesListProps {
  analyses: SavedAnalysis[];
  loading?: boolean;
  isLoading?: boolean;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onExport: (analysis: SavedAnalysis) => Promise<void>;
  onRefreshList?: () => Promise<void>;
  onUpdate?: (id: string, updates: Partial<{ name: string; description: string }>) => Promise<void>;
  // variant prop removed - component is now consolidated
}

export const SavedAnalysesList: React.FC<SavedAnalysesListProps> = ({
  analyses,
  loading,
  isLoading,
  onRefresh,
  onDelete,
  onExport,
  onRefreshList,
  onUpdate,
  // variant prop removed
}) => {
  const actualLoading = loading || isLoading;
  const { updateAnalysis } = useCompetitorAnalysis();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<SavedAnalysis | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modern variant consolidated into this component

  const handleEdit = (analysis: SavedAnalysis) => {
    setEditingAnalysis(analysis);
    setEditName(analysis.name);
    setEditDescription(analysis.description || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnalysis || !editName.trim()) return;
    
    try {
      setActionLoading('edit');
      await updateAnalysis(editingAnalysis.id, {
        name: editName,
        description: editDescription
      });
      setEditDialogOpen(false);
      setEditingAnalysis(null);
      setEditName('');
      setEditDescription('');
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async (analysis: SavedAnalysis) => {
    try {
      setActionLoading(`refresh-${analysis.id}`);
      await onRefresh(analysis.id);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (analysis: SavedAnalysis) => {
    try {
      setActionLoading(`delete-${analysis.id}`);
      await onDelete(analysis.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (analysis: SavedAnalysis) => {
    try {
      setActionLoading(`export-${analysis.id}`);
      await onExport(analysis);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getCompetitorCount = (analysis: SavedAnalysis) => {
    if (analysis.analysis_data?.competitors?.length) {
      return analysis.analysis_data.competitors.length;
    }
    if (Array.isArray(analysis.analysis_data)) {
      return analysis.analysis_data.length;
    }
    return 1; // Assume at least one competitor
  };

  if (actualLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading Analyses</h3>
          <p className="text-muted-foreground">Please wait while we fetch your saved analyses...</p>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Saved Analyses</h3>
          <p className="text-muted-foreground mb-4">
            You haven't saved any competitor analyses yet. Start a new analysis to begin building your competitive intelligence.
          </p>
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Start New Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Saved Analyses ({analyses.length})</h2>
      </div>

      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{analysis.name}</CardTitle>
                  {analysis.description && (
                    <p className="text-sm text-muted-foreground mb-3">{analysis.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant={getStatusColor(analysis.status)}>
                      {analysis.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {getCompetitorCount(analysis)} competitor{getCompetitorCount(analysis) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                    </div>
                    {analysis.updated_at && analysis.updated_at !== analysis.created_at && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Updated {formatDistanceToNow(new Date(analysis.updated_at), { addSuffix: true })}
                      </div>
                    )}
                    {analysis.company_profile_id && (
                      <Badge variant="outline" className="text-2xs" title={`Linked profile: ${analysis.company_profile_id}`}>
                        Profile linked
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(analysis)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRefresh(analysis)}
                      disabled={actionLoading === `refresh-${analysis.id}`}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === `refresh-${analysis.id}` ? 'animate-spin' : ''}`} />
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleExport(analysis)}
                      disabled={actionLoading === `export-${analysis.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{analysis.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(analysis)}
                            disabled={actionLoading === `delete-${analysis.id}`}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionLoading === `delete-${analysis.id}` ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {analysis.data_quality_score !== undefined && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="font-medium">{analysis.data_quality_score}%</span>
                  </div>
                )}
                
                {analysis.industry && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium">{analysis.industry}</span>
                  </div>
                )}
                
                {analysis.actual_cost !== undefined && analysis.actual_cost > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">${analysis.actual_cost.toFixed(4)}</span>
                  </div>
                )}
              </div>

              {Array.isArray((analysis as any)?.analysis_data?.providers_used) && (analysis as any).analysis_data.providers_used.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(analysis as any).analysis_data.providers_used.map((p: string) => (
                    <Badge key={`${analysis.id}-${p}`} variant="secondary" className="text-2xs">
                      {p}
                    </Badge>
                  ))}
                  {Array.isArray((analysis as any)?.analysis_data?.providers_skipped) && (analysis as any).analysis_data.providers_skipped.length > 0 && (
                    <Badge variant="outline" className="text-2xs" title={`Skipped providers: ${(analysis as any).analysis_data.providers_skipped.join(', ')}`}>
                      {(analysis as any).analysis_data.providers_skipped.length} skipped
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Analysis Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter analysis name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this analysis..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveEdit} 
                disabled={!editName.trim() || actionLoading === 'edit'}
              >
                {actionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};