
import { supabase } from '@/integrations/supabase/client';

function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php',
    rb: 'ruby', go: 'go', rs: 'rust', sql: 'sql', swift: 'swift'
  };
  return (ext && map[ext]) || 'unknown';
}

export interface CodeEmbeddingResult {
  id: string;
  file_path: string;
  content: string;
  similarity: number;
}

export const processCodeFile = async (
  file: File, 
  progressCallback?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (progressCallback) progressCallback(10);
    console.log('Starting code embedding process for:', file.name);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    if (progressCallback) progressCallback(20);
    
    // Read the file content
    const fileContent = await file.text();
    console.log('File content read, preparing for processing');
    
    if (progressCallback) progressCallback(40);
    
    // Call the code-embeddings function (scoped by user)
    const language = detectLanguageFromPath(file.name);
    const { data, error } = await supabase.functions.invoke('code-embeddings', {
      body: {
        filePath: file.name,
        content: fileContent,
        userId: session.user.id,
        language
      }
    });

    if (progressCallback) progressCallback(80);

    if (error) {
      console.error('Error from process-code-embeddings:', error);
      throw new Error(error.message || 'Failed to process code embedding');
    }

    if (!data?.success) {
      console.error('Processing failed:', data?.error);
      throw new Error(data?.error || 'Failed to process code embedding');
    }

    console.log('Successfully processed code embedding:', data);
    
    if (progressCallback) progressCallback(100);
    
    return { success: true };
  } catch (error) {
    console.error('Error processing code embedding:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const searchSimilarCode = async (
  query: string, 
  threshold = 0.7, 
  limit = 5
): Promise<CodeEmbeddingResult[]> => {
  try {
    console.log('Starting similar code search:', { query, threshold, limit });
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase.functions.invoke('semantic-code-search', {
      body: {
        query,
        threshold,
        limit,
        userId
      }
    });

    if (error) {
      console.error('Error searching similar code:', error);
      throw error;
    }

    console.log('Found similar code matches:', data.matches?.length || 0);
    return data.matches;
  } catch (error) {
    console.error('Error searching similar code:', error);
    throw error;
  }
};

export const expandContextWithSimilarCode = async (
  errorMessage: string,
  currentFilePath: string
): Promise<CodeEmbeddingResult[]> => {
  try {
    console.log('Expanding context for error:', { errorMessage, currentFilePath });
    
    // Search for similar code with a lower threshold for better recall
    const results = await searchSimilarCode(errorMessage, 0.6, 10);
    
    // Filter out the current file and sort by similarity
    const filteredResults = results
      .filter(result => result.file_path !== currentFilePath)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Return top 5 most relevant results

    console.log('Found similar code contexts:', filteredResults.length);
    return filteredResults;
  } catch (error) {
    console.error('Error expanding context:', error);
    throw error;
  }
};
