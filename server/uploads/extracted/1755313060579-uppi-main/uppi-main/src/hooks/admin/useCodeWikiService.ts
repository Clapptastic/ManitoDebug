
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CodeWikiService {
  service_name: string;
  version: string;
  documentation_url?: string;
  status: 'running' | 'degraded' | 'down';
  features: string[];
}

interface CodeWikiDocumentation {
  title: string;
  content: string;
  lastUpdated?: string;
}

export function useCodeWikiService() {
  const [service, setService] = useState<CodeWikiService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [documentation, setDocumentation] = useState<CodeWikiDocumentation | null>(null);

  const isAvailable = !!service && service.status !== 'down';

  // Fetch real data from the code wiki API
  useEffect(() => {
    setIsLoading(true);
    
    const fetchWikiData = async () => {
      try {
        const [serviceResponse, docsResponse] = await Promise.all([
          supabase.functions.invoke('code-wiki', { body: { action: 'getService' } }),
          supabase.functions.invoke('code-wiki', { body: { action: 'getDocumentation' } })
        ]);

        if (serviceResponse.error) throw serviceResponse.error;
        if (docsResponse.error) throw docsResponse.error;

        setService(serviceResponse.data);
        
        // Use the first documentation entry if available
        const docs = docsResponse.data;
        if (docs && docs.length > 0) {
          setDocumentation({
            title: docs[0].title,
            content: docs[0].content,
            lastUpdated: docs[0].updated_at
          });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching wiki data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchWikiData();
  }, []);

  const refreshService = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('code-wiki', {
        body: { action: 'getService' }
      });

      if (error) throw error;
      setService(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error refreshing service:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  return {
    service,
    isLoading,
    error,
    isAvailable,
    refreshService,
    documentation
  };
}
