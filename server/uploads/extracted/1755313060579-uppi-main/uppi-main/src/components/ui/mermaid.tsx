import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
  className?: string;
  title?: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ 
  chart, 
  className = "", 
  title 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  // Initialize mermaid once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        primaryColor: 'hsl(var(--primary))',
        primaryTextColor: 'hsl(var(--primary-foreground))',
        primaryBorderColor: 'hsl(var(--border))',
        lineColor: 'hsl(var(--muted-foreground))',
        secondaryColor: 'hsl(var(--secondary))',
        tertiaryColor: 'hsl(var(--muted))',
        background: 'hsl(var(--background))',
        mainBkg: 'hsl(var(--card))',
        secondBkg: 'hsl(var(--muted))',
        tertiaryBkg: 'hsl(var(--accent))',
      },
      fontFamily: 'inherit',
      fontSize: 14,
      securityLevel: 'loose'
    });
  }, []);

  // Render mermaid chart
  const renderChart = async () => {
    if (!elementRef.current || !chart.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear previous content
      elementRef.current.innerHTML = '';
      
      // Generate unique ID for this chart
      const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Render the chart
      const { svg } = await mermaid.render(chartId, chart);
      
      // Insert rendered SVG
      if (elementRef.current) {
        elementRef.current.innerHTML = svg;
        setSvgContent(svg);
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render chart');
      
      if (elementRef.current) {
        elementRef.current.innerHTML = `
          <div class="flex items-center justify-center p-8 text-destructive">
            <div class="text-center">
              <p class="font-semibold">Chart Rendering Error</p>
              <p class="text-sm mt-2">${err instanceof Error ? err.message : 'Invalid mermaid syntax'}</p>
            </div>
          </div>
        `;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Re-render when chart content changes
  useEffect(() => {
    renderChart();
  }, [chart]);

  // Copy chart source to clipboard
  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      toast({
        title: 'Copied to clipboard',
        description: 'Mermaid chart source has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy chart source to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Download chart as SVG
  const downloadSvg = () => {
    if (!svgContent) {
      toast({
        title: 'No chart to download',
        description: 'Please wait for the chart to render first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-chart-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download started',
        description: 'Mermaid chart has been saved as SVG.',
      });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: 'Failed to download chart as SVG.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copySource}
              disabled={isLoading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Source
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSvg}
              disabled={isLoading || !svgContent}
            >
              <Download className="h-4 w-4 mr-2" />
              Download SVG
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={renderChart}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      )}
      
      <CardContent className={title ? 'pt-4' : 'p-6'}>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Rendering chart...</span>
              </div>
            </div>
          )}
          
          <div 
            ref={elementRef}
            className="mermaid-container overflow-auto"
            style={{ 
              minHeight: error ? '120px' : '200px',
              width: '100%'
            }}
          />
        </div>
        
        {!title && !isLoading && !error && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copySource}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Source
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSvg}
              disabled={!svgContent}
            >
              <Download className="h-4 w-4 mr-2" />
              Download SVG
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for using mermaid in other components
export const useMermaid = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: 'hsl(var(--primary))',
          primaryTextColor: 'hsl(var(--primary-foreground))',
          primaryBorderColor: 'hsl(var(--border))',
          lineColor: 'hsl(var(--muted-foreground))',
          secondaryColor: 'hsl(var(--secondary))',
          tertiaryColor: 'hsl(var(--muted))',
          background: 'hsl(var(--background))',
          mainBkg: 'hsl(var(--card))',
          secondBkg: 'hsl(var(--muted))',
          tertiaryBkg: 'hsl(var(--accent))',
        },
        fontFamily: 'inherit',
        fontSize: 14,
        securityLevel: 'loose'
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const renderMermaid = async (definition: string): Promise<string> => {
    const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { svg } = await mermaid.render(chartId, definition);
    return svg;
  };

  return { renderMermaid, isInitialized };
};