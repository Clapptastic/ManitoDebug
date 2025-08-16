import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CodeEmbedding, CodeEmbeddingStats, CodeSearchResult } from '@/types/code-embeddings';
import { processCodeFile, searchSimilarCode as searchService } from '@/services/codeEmbeddings';
import { toast } from '@/hooks/use-toast';

export const useCodeEmbeddings = () => {
  const [embeddings, setEmbeddings] = useState<CodeEmbedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [stats, setStats] = useState<CodeEmbeddingStats>({
    total: 0,
    tokenCount: 0,
    avgTokensPerFile: 0,
    fileTypes: [],
    lastUpdated: new Date().toISOString(),
    totalEmbeddings: 0,
    tokensUsed: 0,
    status: 'idle',
    lastCheck: new Date().toISOString()
  });

  const getFileTypeStats = (embeddingsList: CodeEmbedding[]) => {
    const fileTypeMap = new Map<string, number>();
    
    embeddingsList.forEach(embedding => {
      const extension = embedding.file_path.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypeMap.set(extension, (fileTypeMap.get(extension) || 0) + 1);
    });

    const total = embeddingsList.length;
    return Array.from(fileTypeMap.entries()).map(([extension, count]) => ({
      extension,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const computeStats = (list: CodeEmbedding[], processing: boolean): CodeEmbeddingStats => {
    const total = list.length;
    const tokenCount = list.reduce((sum, e) => sum + (e.token_count ?? Math.ceil(((e.content || '').length) / 4)), 0);
    const avgTokens = total > 0 ? Math.round(tokenCount / total) : 0;
    const lastUpdatedIso = total > 0
      ? new Date(Math.max(...list.map((e) => new Date((e.updated_at || e.created_at) as string).getTime()))).toISOString()
      : new Date().toISOString();
    return {
      total,
      tokenCount,
      avgTokensPerFile: avgTokens,
      fileTypes: getFileTypeStats(list),
      lastUpdated: lastUpdatedIso,
      totalEmbeddings: total,
      tokensUsed: tokenCount,
      status: processing ? 'processing' : 'active',
      lastCheck: lastUpdatedIso
    };
  };


  const fetchEmbeddings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Authentication required');
        setEmbeddings([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('code_embeddings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching code embeddings:', fetchError);
        setError(fetchError.message);
        setEmbeddings([]);
      } else {
        setEmbeddings(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching code embeddings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEmbeddings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEmbeddings = async () => {
    setIsRefreshing(true);
    await fetchEmbeddings();
    setIsRefreshing(false);
  };

  const uploadCodeFile = async (file: File, progressCallback?: (progress: number) => void): Promise<{ success: boolean; error?: string }> => {
    try {
      setStatus('loading');
      const result = await processCodeFile(file, progressCallback);
      
      if (result.success) {
        await fetchEmbeddings(); // Refresh the list
        toast({
          title: 'File processed successfully',
          description: `${file.name} has been processed and embedded.`,
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Upload failed' };
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setStatus('idle');
    }
  };

  const removeEmbedding = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('code_embeddings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing embedding:', error);
        toast({
          title: 'Error removing file',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // Update local state
      setEmbeddings(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'File removed',
        description: 'Code embedding has been removed successfully.',
      });
      return true;
    } catch (err) {
      console.error('Error removing embedding:', err);
      toast({
        title: 'Error removing file',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  const requestEmbeddingGeneration = async (): Promise<void> => {
    try {
      setStatus('loading');
      toast({
        title: 'Building embeddings',
        description: 'Processing your existing code files to generate enhanced embeddings...'
      });

      // Invoke edge function to process entire codebase (admin-only)
      const { data, error } = await supabase.functions.invoke('process-application-embeddings', {
        body: {
          operation: 'process_codebase',
          options: {
            enhanceMetadata: true,
            regenerateEmbeddings: true
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to call embedding service');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Embedding generation failed');
      }

      await refreshEmbeddings();
      
      const summary = data?.summary || {};
      toast({
        title: 'Embeddings generation complete',
        description: `Processed ${summary.total || 0} files with ${summary.totalTokens || 0} tokens. ${summary.failed || 0} files failed.`,
      });
    } catch (err) {
      console.error('Error requesting embedding generation:', err);
      toast({
        title: 'Error generating embeddings',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setStatus('idle');
    }
  };

  const searchSimilarCode = async (query: string): Promise<CodeSearchResult[]> => {
    try {
      const results = await searchService(query, 0.7, 5);
      return results.map(result => ({
        id: result.id,
        file_path: result.file_path,
        content: result.content,
        similarity: result.similarity
      }));
    } catch (err) {
      console.error('Error searching similar code:', err);
      throw err;
    }
  };

  // Load persisted stats on mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        const saved = localStorage.getItem(`codeEmbeddings:stats:${uid}`);
        if (saved) {
          try { setStats({ ...JSON.parse(saved), status: 'active' }); } catch {}
        }
      }
    })();
  }, []);

  // Recompute and persist stats whenever data or status changes
  useEffect(() => {
    (async () => {
      const newStats = computeStats(embeddings, status === 'loading' || isRefreshing);
      setStats(newStats);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        try { localStorage.setItem(`codeEmbeddings:stats:${uid}`, JSON.stringify(newStats)); } catch {}
      }
    })();
  }, [embeddings, status, isRefreshing]);

  // Initial fetch
  useEffect(() => {
    fetchEmbeddings();
  }, []);

  return {
    embeddings,
    stats,
    isLoading,
    error,
    refresh: fetchEmbeddings,
    refreshEmbeddings,
    uploadCodeFile,
    removeEmbedding,
    isRefreshing,
    status,
    requestEmbeddingGeneration,
    searchSimilarCode
  };
};