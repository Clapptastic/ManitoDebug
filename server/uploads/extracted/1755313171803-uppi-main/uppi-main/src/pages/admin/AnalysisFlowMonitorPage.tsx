import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ModernFlowMonitor } from '@/components/admin/analysis/ModernFlowMonitor';

const AnalysisFlowMonitorPage: React.FC = () => {
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/admin/analysis-flow`
    : '/admin/analysis-flow';

  return (
    <>
      <Helmet>
        <title>Analysis Flow Monitor | Admin Dashboard</title>
        <meta name="description" content="Real-time competitor analysis pipeline monitoring with advanced diagnostics and performance insights." />
        <meta name="keywords" content="analysis, monitoring, pipeline, diagnostics, admin, dashboard" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Analysis Flow Monitor</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time pipeline monitoring and diagnostics
                </p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-6 py-8">
          <ModernFlowMonitor />
        </main>
      </div>
    </>
  );
};

export default AnalysisFlowMonitorPage;
