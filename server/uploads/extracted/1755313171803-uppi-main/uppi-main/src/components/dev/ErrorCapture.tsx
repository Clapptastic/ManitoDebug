import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Bug, 
  X, 
  AlertTriangle, 
  Info, 
  Code, 
  Package,
  Monitor,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorCaptureProps {
  error: Error;
  errorInfo?: any;
  componentStack?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  onClose: () => void;
}

interface SystemInfo {
  userAgent: string;
  url: string;
  timestamp: string;
  viewport: string;
  memory?: string;
  connection?: string;
}

interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

export const ErrorCapture: React.FC<ErrorCaptureProps> = ({
  error,
  errorInfo,
  componentStack,
  userAgent,
  url,
  timestamp,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Get system information
  const getSystemInfo = (): SystemInfo => {
    const nav = navigator as any;
    return {
      userAgent: nav.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      memory: nav.deviceMemory ? `${nav.deviceMemory}GB` : 'Unknown',
      connection: nav.connection ? `${nav.connection.effectiveType} (${nav.connection.downlink}Mbps)` : 'Unknown'
    };
  };

  // Key dependencies from package.json
  const getDependencies = (): DependencyInfo[] => {
    return [
      { name: '@supabase/supabase-js', version: '^2.49.4', type: 'dependency' },
      { name: 'react', version: '^18.3.1', type: 'dependency' },
      { name: 'react-dom', version: '^18.3.1', type: 'dependency' },
      { name: 'react-router-dom', version: '^6.26.2', type: 'dependency' },
      { name: '@radix-ui/react-toast', version: '^1.2.1', type: 'dependency' },
      { name: 'tailwindcss', version: 'latest', type: 'dependency' },
      { name: 'typescript', version: 'latest', type: 'devDependency' },
      { name: 'vite', version: '^3.0.5', type: 'devDependency' }
    ];
  };

  const systemInfo = getSystemInfo();
  const dependencies = getDependencies();

  // Create comprehensive error report
  const createErrorReport = (): string => {
    const report = {
      // Error Details
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause || null
      },
      
      // React Error Info
      errorInfo: errorInfo ? {
        componentStack: errorInfo.componentStack || componentStack,
        errorBoundary: errorInfo.errorBoundary || null
      } : null,
      
      // System Information
      system: systemInfo,
      
      // Browser/Environment
      environment: {
        isDevelopment: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        nodeEnv: import.meta.env.NODE_ENV || 'development',
        viteDev: import.meta.env.DEV,
        baseUrl: import.meta.env.BASE_URL
      },
      
      // Key Dependencies
      dependencies: dependencies,
      
      // Additional Context
      context: {
        route: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer || 'direct',
        localStorage: getLocalStorageInfo(),
        sessionStorage: getSessionStorageInfo()
      }
    };

    return `# ERROR REPORT FOR AI DEBUGGING

## Quick Summary
**Error:** ${error.name}: ${error.message}
**Location:** ${window.location.pathname}
**Timestamp:** ${systemInfo.timestamp}
**Environment:** React + TypeScript + Vite + Supabase

## Error Details
\`\`\`
Name: ${error.name}
Message: ${error.message}
Stack Trace:
${error.stack}
\`\`\`

${errorInfo ? `
## React Component Stack
\`\`\`
${errorInfo.componentStack || componentStack || 'No component stack available'}
\`\`\`
` : ''}

## System Information
- **User Agent:** ${systemInfo.userAgent}
- **Current URL:** ${systemInfo.url}
- **Viewport:** ${systemInfo.viewport}
- **Memory:** ${systemInfo.memory}
- **Connection:** ${systemInfo.connection}
- **Timestamp:** ${systemInfo.timestamp}

## Environment
- **Mode:** ${import.meta.env.MODE}
- **Development:** ${import.meta.env.DEV}
- **Base URL:** ${import.meta.env.BASE_URL}

## Key Dependencies
${dependencies.map(dep => `- ${dep.name}: ${dep.version} (${dep.type})`).join('\n')}

## Application Context
- **Current Route:** ${window.location.pathname}
- **Search Params:** ${window.location.search || 'None'}
- **Hash:** ${window.location.hash || 'None'}
- **Referrer:** ${document.referrer || 'Direct navigation'}

## Local Storage Context
${Object.keys(localStorage).length > 0 ? 
  Object.keys(localStorage).map(key => `- ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`).join('\n') 
  : '- No localStorage data'}

## Technical Stack
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Radix UI
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **State Management:** React Hooks + Zustand
- **Routing:** React Router v6
- **UI Components:** Custom + shadcn/ui

## Project Structure Context
This is a SaaS platform with:
- Authentication system (Supabase Auth)
- Company profile management
- AI-powered analysis features
- Document management
- Real-time data sync
- Edge functions for backend logic

## Common Solutions for Similar Errors
1. Check if required environment variables are set
2. Verify Supabase connection and RLS policies
3. Ensure proper authentication state
4. Check for missing dependencies or version conflicts
5. Verify TypeScript types and interfaces
6. Check React component lifecycle and hooks usage
7. Validate data fetching and error boundaries

## Raw Error Object
\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`

---
*Generated by Error Capture System v1.0 - Development Mode Only*`;
  };

  const getLocalStorageInfo = () => {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          info[key] = value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : null;
        }
      }
      return info;
    } catch {
      return { error: 'Unable to access localStorage' };
    }
  };

  const getSessionStorageInfo = () => {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          info[key] = value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : null;
        }
      }
      return info;
    } catch {
      return { error: 'Unable to access sessionStorage' };
    }
  };

  const copyToClipboard = async () => {
    try {
      const report = createErrorReport();
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast({
        title: "Error Report Copied!",
        description: "The detailed error report has been copied to your clipboard. Paste it into your AI coding agent.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard. Try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] border-destructive">
        <CardHeader className="bg-destructive/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Development Error Capture</CardTitle>
              <Badge variant="outline" className="text-xs">DEV MODE</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Full Report
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">{error.name}</h3>
                    <p className="text-muted-foreground">{error.message}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground">{window.location.pathname}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Browser</h4>
                    <p className="text-sm text-muted-foreground">
                      {navigator.userAgent.split(' ').slice(-2).join(' ')}
                    </p>
                  </div>
                </div>
                
                <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Error Report for AI Agent'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="p-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Error Stack</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                  
                  {componentStack && (
                    <div>
                      <h4 className="font-medium mb-2">Component Stack</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="system" className="p-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">System Information</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Viewport:</span>
                        <span>{systemInfo.viewport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span>{systemInfo.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Connection:</span>
                        <span>{systemInfo.connection}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Key Dependencies</h4>
                    <div className="space-y-1">
                      {dependencies.slice(0, 8).map((dep) => (
                        <div key={dep.name} className="flex justify-between text-sm">
                          <span>{dep.name}</span>
                          <Badge variant={dep.type === 'dependency' ? 'default' : 'secondary'} className="text-xs">
                            {dep.version}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="report" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Complete AI-Ready Report</h4>
                  <Button onClick={copyToClipboard} size="sm" disabled={copied}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <Textarea
                  value={createErrorReport()}
                  readOnly
                  className="h-80 text-xs font-mono resize-none"
                  placeholder="Generating comprehensive error report..."
                />
                <div className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  This report includes all necessary context for AI coding agents to understand and help fix the issue.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};