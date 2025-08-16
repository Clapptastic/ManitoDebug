import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calendar, FileText, Trash2 } from 'lucide-react';
import type { CompetitorAnalysisEntity } from '@/types/competitor/unified-types';

interface DeleteAnalysisDialogProps {
  analysis: CompetitorAnalysisEntity;
  onDelete: () => Promise<void>;
  trigger: React.ReactNode;
}

export const DeleteAnalysisDialog: React.FC<DeleteAnalysisDialogProps> = ({
  analysis,
  onDelete,
  trigger
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAnalysisMetrics = () => {
    const metrics = [];
    
    if (analysis.analysis_data?.results) {
      const resultsCount = Array.isArray(analysis.analysis_data.results) 
        ? analysis.analysis_data.results.length 
        : Object.keys(analysis.analysis_data.results).length;
      metrics.push(`${resultsCount} competitor${resultsCount !== 1 ? 's' : ''}`);
    }
    
    if (analysis.data_quality_score) {
      metrics.push(`${Math.round(analysis.data_quality_score)}% data quality`);
    }
    
    if (analysis.created_at) {
      const daysAgo = Math.floor((Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60 * 60 * 24));
      metrics.push(`${daysAgo} day${daysAgo !== 1 ? 's' : ''} old`);
    }
    
    return metrics;
  };

  const metrics = getAnalysisMetrics();

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          
          <div className="text-center space-y-2">
            <AlertDialogTitle className="text-lg">Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this competitor analysis? This action cannot be undone.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Analysis Details */}
        <div className="space-y-4">
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-medium text-sm truncate" title={analysis.name}>
                  {analysis.name}
                </p>
                {analysis.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {analysis.description}
                  </p>
                )}
              </div>
            </div>

            {/* Analysis Metrics */}
            {metrics.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{metrics.join(' • ')}</span>
              </div>
            )}

            {/* Last Modified */}
            {analysis.updated_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Last modified: {format(new Date(analysis.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Status Badge */}
            {analysis.status && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {analysis.status}
                </Badge>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Warning Message */}
          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  This action is permanent
                </p>
                <p className="text-xs text-destructive/80">
                  All analysis data, insights, and reports will be permanently deleted and cannot be recovered.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete Analysis</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};