/**
 * ReportSection - Replacement for legacy report visualization
 * Now uses the enhanced report system with proper typing
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, Download, Share2 } from 'lucide-react';
import type { CompetitorAnalysisEntity } from '@/types/competitor-analysis';

interface ReportSectionProps {
  analysis: CompetitorAnalysisEntity;
  title?: string;
  showActions?: boolean;
}

const ReportSection: React.FC<ReportSectionProps> = ({ 
  analysis, 
  title = "Analysis Report",
  showActions = true 
}) => {
  const handleDownload = () => {
    // Implement download functionality
    console.log('Download report for:', analysis.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share report for:', analysis.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {showActions && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Status: {analysis.status || 'completed'}
            </Badge>
            <Badge variant="outline">
              ID: {analysis.id?.slice(0, 8)}...
            </Badge>
          </div>
          
          {analysis.analysis_data && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Analysis Progress</div>
              <Progress value={85} className="w-full" />
              <div className="text-xs text-muted-foreground">
                Data processing completed
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Use the enhanced report system in the Details view for comprehensive analysis visualization.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportSection;