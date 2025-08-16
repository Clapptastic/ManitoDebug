import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mermaid } from './mermaid';
import { MarkdownWithMermaid } from './markdown-with-mermaid';

const exampleCharts = {
  flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`,
  
  sequence: `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    U->>A: Click Analyze
    A->>S: Send Request
    S-->>A: Return Results
    A-->>U: Display Data`,
  
  flowchartComplex: `graph TB
    subgraph "Frontend"
        A[React App] --> B[Component]
        B --> C[Hook]
    end
    
    subgraph "Backend"
        D[Edge Function] --> E[Supabase]
        E --> F[Database]
    end
    
    C --> D
    F --> E
    E --> D
    D --> C`,
  
  gitgraph: `gitGraph
    commit id: "Initial"
    branch develop
    commit id: "Feature 1"
    commit id: "Feature 2"
    checkout main
    merge develop
    commit id: "Release"`,
  
  pie: `pie title Platform Usage
    "React" : 45
    "Vue" : 25
    "Angular" : 20
    "Other" : 10`,
    
  markdown: `# Competitor Analysis Flow

This document outlines our competitor analysis process.

## Process Overview

\`\`\`mermaid
graph TD
    A[Start Analysis] --> B{API Keys Available?}
    B -->|Yes| C[Run Analysis]
    B -->|No| D[Setup API Keys]
    D --> C
    C --> E[Generate Report]
    E --> F[Save Results]
\`\`\`

## System Architecture

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant EF as Edge Function
    participant DB as Database
    participant AI as AI Provider
    
    U->>UI: Input competitors
    UI->>EF: Start analysis
    EF->>DB: Save progress
    EF->>AI: Analyze competitor
    AI-->>EF: Return insights
    EF->>DB: Update results
    EF-->>UI: Analysis complete
    UI-->>U: Display results
\`\`\`

## Key Features

- Real-time progress tracking
- Multi-provider AI analysis
- Secure API key management
- Comprehensive reporting`
};

export const MermaidDemo: React.FC = () => {
  const [customChart, setCustomChart] = useState(exampleCharts.flowchart);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mermaid Chart Rendering Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This application now supports rendering Mermaid charts and diagrams. 
            Use them in documentation, analysis reports, or anywhere you need visual diagrams.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="examples" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="examples">Chart Examples</TabsTrigger>
          <TabsTrigger value="custom">Custom Chart</TabsTrigger>
          <TabsTrigger value="markdown">Markdown Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Mermaid 
              title="Simple Flowchart"
              chart={exampleCharts.flowchart} 
            />
            
            <Mermaid 
              title="Sequence Diagram"
              chart={exampleCharts.sequence} 
            />
            
            <Mermaid 
              title="Complex System Architecture"
              chart={exampleCharts.flowchartComplex} 
            />
            
            <Mermaid 
              title="Pie Chart"
              chart={exampleCharts.pie} 
            />
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Chart Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={customChart}
                  onChange={(e) => setCustomChart(e.target.value)}
                  placeholder="Enter your Mermaid chart definition..."
                  className="min-h-[200px] font-mono text-sm"
                />
                
                <div className="flex gap-2">
                  {Object.entries(exampleCharts).filter(([key]) => key !== 'markdown').map(([key, chart]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomChart(chart)}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Mermaid 
              title="Your Custom Chart"
              chart={customChart} 
            />
          </div>
        </TabsContent>

        <TabsContent value="markdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Markdown with Mermaid Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Mermaid charts can be embedded directly in Markdown content using code blocks:
              </p>
              
              <MarkdownWithMermaid>
                {exampleCharts.markdown}
              </MarkdownWithMermaid>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};