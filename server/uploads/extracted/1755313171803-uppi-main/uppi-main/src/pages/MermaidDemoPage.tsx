import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MermaidDemo } from '@/components/ui/mermaid-demo';

const MermaidDemoPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Mermaid Chart Demo - Visual Diagrams</title>
        <meta 
          name="description" 
          content="Explore Mermaid chart capabilities with interactive examples including flowcharts, sequence diagrams, and system architecture visualizations." 
        />
        <meta name="keywords" content="mermaid, diagrams, charts, visualization, flowchart, sequence diagram" />
        <link rel="canonical" href="/mermaid-demo" />
      </Helmet>
      
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mermaid Chart Rendering</h1>
          <p className="text-muted-foreground">
            Interactive examples of Mermaid chart rendering capabilities in our application.
          </p>
        </div>
        
        <MermaidDemo />
      </div>
    </>
  );
};

export default MermaidDemoPage;