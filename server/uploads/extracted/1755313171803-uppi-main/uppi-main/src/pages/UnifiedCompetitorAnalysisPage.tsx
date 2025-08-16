/**
 * UNIFIED Competitor Analysis Page
 * Stage 5: Integration & Cleanup - Replace legacy dashboard with unified system
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { UnifiedCompetitorAnalysisContainer } from '@/components/competitor-analysis/unified/UnifiedCompetitorAnalysisContainer';

const UnifiedCompetitorAnalysisPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Competitor Analysis - AI-Powered Business Intelligence</title>
        <meta 
          name="description" 
          content="Analyze your competitors with AI-powered insights. Get comprehensive SWOT analysis, market positioning, and strategic recommendations." 
        />
        <meta name="keywords" content="competitor analysis, AI, business intelligence, SWOT analysis, market research" />
        <link rel="canonical" href="/competitor-analysis" />
      </Helmet>
      
      <UnifiedCompetitorAnalysisContainer />
    </>
  );
};

export default UnifiedCompetitorAnalysisPage;