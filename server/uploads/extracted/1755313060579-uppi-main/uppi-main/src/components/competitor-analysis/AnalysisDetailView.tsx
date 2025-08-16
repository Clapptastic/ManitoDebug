import React from 'react';
import { EnhancedAnalysisDetailView } from './enhanced/EnhancedAnalysisDetailView';

interface AnalysisDetailProps {
  analysisId?: string;
}

export const AnalysisDetailView: React.FC<AnalysisDetailProps> = ({ analysisId }) => {
  return <EnhancedAnalysisDetailView analysisId={analysisId} />;
};