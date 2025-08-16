import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Loader2, X, Timer, BarChart, TrendingUp } from 'lucide-react';
import { AnalysisProgress as ProgressType } from '@/hooks/useCompetitorAnalysis';

interface AnalysisProgressProps {
  progress: ProgressType;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ 
  progress, 
  onCancel,
  showCancelButton = false 
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = React.useState<number | null>(null);
  const [startTime] = React.useState(Date.now());

  // Update elapsed time and calculate ETA
  React.useEffect(() => {
    if (progress.status === 'analyzing' || progress.status === 'starting') {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        // Calculate estimated time remaining based on progress
        if (progress.completedCount > 0 && progress.totalCount > 0) {
          const progressRate = progress.completedCount / elapsed;
          const remainingItems = progress.totalCount - progress.completedCount;
          const estimatedSeconds = Math.ceil(remainingItems / progressRate);
          setEstimatedTimeRemaining(estimatedSeconds);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [progress.status, progress.completedCount, progress.totalCount, startTime]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'starting':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'analyzing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'starting':
        return 'secondary';
      case 'analyzing':
        return 'default';
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getProgressPercentage = () => {
    if (progress.totalCount === 0) return 0;
    return Math.round((progress.completedCount / progress.totalCount) * 100);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProgressIndicatorColor = () => {
    if (progress.status === 'error') return 'bg-destructive';
    if (progress.status === 'completed') return 'bg-green-500';
    return 'bg-primary';
  };

  if (progress.status === 'idle') {
    return null;
  }

  const progressPercentage = getProgressPercentage();

  return (
    <Card className="w-full animate-fade-in shadow-lg border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-lg flex items-center gap-2">
                Analysis Progress
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              {progress.status === 'analyzing' && (
                <div className="text-sm text-muted-foreground font-normal">
                  Processing competitor intelligence...
                </div>
              )}
            </div>
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="animate-pulse">
              {progress.status === 'starting' && 'Initializing'}
              {progress.status === 'analyzing' && 'In Progress'}
              {progress.status === 'completed' && 'Complete'}
              {progress.status === 'error' && 'Failed'}
            </Badge>
            {showCancelButton && (progress.status === 'analyzing' || progress.status === 'starting') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel}
                className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Overall Progress</span>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                {progress.completedCount}/{progress.totalCount}
              </span>
              <span className="font-medium text-foreground">{progressPercentage}%</span>
            </div>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="w-full h-3 bg-secondary"
            indicatorClassName={`transition-all duration-700 ease-out ${getProgressIndicatorColor()}`}
            aria-label={`Analysis progress: ${progressPercentage}% complete`}
          />
        </div>

        {/* Time Information */}
        {(progress.status === 'analyzing' || progress.status === 'starting') && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Elapsed Time</div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Timer className="h-4 w-4" />
                {formatTime(elapsedTime)}
              </div>
            </div>
            {estimatedTimeRemaining && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Est. Remaining</div>
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {formatTime(estimatedTimeRemaining)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Status */}
        {progress.status === 'analyzing' && progress.currentCompetitor && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium">Currently analyzing:</p>
            </div>
            <p className="text-lg font-semibold text-primary pl-6">{progress.currentCompetitor}</p>
          </div>
        )}

        {/* Status Messages */}
        {progress.statusMessage && progress.status === 'analyzing' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{progress.statusMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'error' && progress.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Analysis Failed</p>
                <p className="text-sm text-destructive/80">
                  {progress.error ? String(progress.error) : 'An error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {progress.status === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-scale-in">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  Analysis Completed Successfully!
                </p>
                <p className="text-sm text-green-700">
                  {progress.results.length} competitor{progress.results.length !== 1 ? 's' : ''} analyzed in {formatTime(elapsedTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session ID (for debugging) */}
        {progress.sessionId && process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Session ID: {progress.sessionId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};