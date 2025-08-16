import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Code, 
  Terminal,
  X
} from 'lucide-react';
import { errorTracker, TrackedError } from '@/utils/errorTracker';
import { useToast } from '@/hooks/use-toast';
import { useDevTools } from '@/hooks/useDevTools';
import { supabase } from '@/integrations/supabase/client';

export const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { trackedErrors, captureError, resetErrors } = useDevTools();
  const errors: TrackedError[] = trackedErrors;
  const { toast } = useToast();

  // Access control and settings
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(true); // default ON per requirement
  const [accessChecked, setAccessChecked] = useState<boolean>(false);
  const originalConsoleError = useRef<typeof console.error | null>(null);

  const safeStringify = (v: unknown) => {
    try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) { if (mounted) { setIsSuperAdmin(false); setAccessChecked(true); } return; }
        // Only super admin can see
        const { data: role } = await supabase.rpc('get_user_role', { user_id_param: userId });
        const isSuper = role === 'super_admin';
        // Debug mode from settings (metadata.debug_mode), default ON
        let debug = true;
        try {
          const { data: settings } = await supabase
            .from('application_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          const md = (settings as any)?.metadata as Record<string, unknown> | undefined;
          if (md && Object.prototype.hasOwnProperty.call(md, 'debug_mode')) {
            debug = Boolean((md as any).debug_mode);
          }
        } catch {}
        if (mounted) {
          setIsSuperAdmin(!!isSuper);
          setDebugEnabled(debug);
          setAccessChecked(true);
        }
      } catch {
        if (mounted) setAccessChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Realtime + global listeners only when allowed
  useEffect(() => {
    if (!(accessChecked && isSuperAdmin && debugEnabled)) return;

    const onError = (e: ErrorEvent) => {
      try { errorTracker.trackError(e.error instanceof Error ? e.error : new Error(e.message || 'Unknown error'), 'window.error'); } catch {}
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      try {
        const reason: any = (e as any).reason;
        const err = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : safeStringify(reason));
        errorTracker.trackError(err, 'unhandledrejection');
      } catch {}
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    originalConsoleError.current = console.error;
    console.error = (...args: any[]) => {
      try { errorTracker.trackError(new Error(args.map(a => safeStringify(a)).join(' ')), 'console.error'); } catch {}
      try { originalConsoleError.current?.(...(args as any)); } catch {}
    };

    const channel = supabase
      .channel('realtime:admin-audit-errors')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        try {
          const row: any = (payload as any).new || {};
          const action = String(row.action || '').toLowerCase();
          const meta = row.metadata || {};
          const errMsg = (meta && (meta.error || meta.message)) || row.resource_type || 'Audit log insert';
          if (action.includes('error') || (meta && meta.error)) {
            errorTracker.trackError(new Error(typeof errMsg === 'string' ? errMsg : safeStringify(errMsg)), 'audit_logs');
          }
        } catch {}
      })
      .subscribe();

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      if (originalConsoleError.current) console.error = originalConsoleError.current;
      supabase.removeChannel(channel);
    };
  }, [accessChecked, isSuperAdmin, debugEnabled]);

  if (!accessChecked || !isSuperAdmin || !debugEnabled) {
    return null;
  }
  const refreshErrors = () => {
    // Hook already subscribes; this forces a subtle UI tick and feedback
    toast({ title: 'Refreshed', description: `${errors.length} error(s) loaded from centralized tracker` });
  };

  const clearAllErrors = () => {
    errorTracker.clearErrors();
    resetErrors();
    toast({
      title: "Errors Cleared",
      description: "All captured errors have been cleared.",
    });
  };

  const triggerTestError = () => {
    try {
      // Intentional error for testing
      throw new Error("This is a test error for development debugging");
    } catch (error) {
      captureError(error as Error, 'DevTools:test_error_trigger');
    }
  };

  const buildErrorReport = (e: TrackedError) => {
    return JSON.stringify(
      {
        title: 'Centralized Client Error',
        id: e.id,
        message: e.message,
        stack: e.stack,
        timestamp: new Date(e.timestamp).toISOString(),
        source: e.source,
        url: e.url,
        userAgent: e.userAgent,
      },
      null,
      2
    );
  };

  const copyErrorReport = (errorInfo: TrackedError) => {
    const report = buildErrorReport(errorInfo);
    navigator.clipboard.writeText(report).then(() => {
      toast({ title: 'Error Report Copied!', description: 'The detailed error report has been copied to your clipboard.' });
    });
  };

  const copyAllErrors = () => {
    const list = errors;
    if (!list || list.length === 0) {
      toast({ title: 'No Errors', description: 'There are no captured errors to copy.' });
      return;
    }
    const combined = list.map((e, i) => `# Error ${i + 1}\n\n${buildErrorReport(e)}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(combined)
      .then(() => toast({ title: 'All Errors Copied', description: `${list.length} error report(s) copied to clipboard.` }))
      .catch(() => toast({ title: 'Copy Failed', description: 'Unable to copy error reports.', variant: 'destructive' }));
  };
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Bug className="h-4 w-4 mr-2" />
          Dev Tools
          {errors.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
              {errors.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96">
      <Card className="border-amber-200 bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Development Tools
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="errors" className="text-xs">
                Errors ({errors.length})
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs">
                Tools
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={refreshErrors} 
                  size="sm"
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button 
                  onClick={clearAllErrors} 
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <Button 
                  onClick={copyAllErrors}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={errors.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>
              
              <ScrollArea className="h-64">
                {errors.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    No errors captured yet
                    <div className="mt-2 text-xs">
                      Monitoring: JS errors, Network errors, Console errors, Supabase errors
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {errors.map((e, index) => (
                      <Card key={index} className="text-xs">
                        <CardContent className="p-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-destructive truncate">
                                Client Error
                              </div>
                              <div className="text-muted-foreground truncate">
                                {e.message}
                              </div>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {e.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {e.source}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {new Date(e.timestamp).toLocaleTimeString()}
                                </Badge>
                                {e.url && (
                                  <Badge variant="outline" className="text-xs">
                                    {(() => { try { return new URL(e.url).hostname; } catch { return e.url; } })()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyErrorReport(e)}
                              className="ml-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tools" className="space-y-2">
              <div className="space-y-2">
                <Button 
                  onClick={triggerTestError} 
                  size="sm" 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Bug className="h-3 w-3 mr-2" />
                  Trigger Test Error
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Environment:</div>
                  <div>Mode: {import.meta.env.MODE}</div>
                  <div>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
                  <div>Base URL: {import.meta.env.BASE_URL}</div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Features:</div>
                  <div>• Auto error capture</div>
                  <div>• Clipboard copy for AI</div>
                  <div>• Component context</div>
                  <div>• Stack traces</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};