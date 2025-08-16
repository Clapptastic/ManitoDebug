import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnalysisDetailView } from '@/components/competitor-analysis/AnalysisDetailView';

const AnalysisDetailPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const canonicalUrl = typeof window !== 'undefined' && analysisId
    ? `${window.location.origin}/market-research/competitor-analysis/details/${analysisId}`
    : '/market-research/competitor-analysis/details';
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Competitor Analysis Report",
    identifier: analysisId || undefined,
    url: canonicalUrl
  };
  return (
    <>
      <Helmet>
        <title>Competitor Analysis Report | Details</title>
        <meta name="description" content="Detailed competitor analysis report and insights." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <AnalysisDetailView analysisId={analysisId} />
    </>
  );
};

export default AnalysisDetailPage;