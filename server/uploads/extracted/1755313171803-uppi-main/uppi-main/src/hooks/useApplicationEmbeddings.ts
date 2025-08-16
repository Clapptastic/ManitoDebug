import { useState, useCallback } from 'react';
import { ApplicationEmbeddingsService, EmbeddingResult, SearchResult } from '@/services/embeddings/ApplicationEmbeddingsService';

export interface UseApplicationEmbeddingsReturn {
  // State
  isProcessing: boolean;
  isSearching: boolean;
  processingProgress: number;
  error: string | null;
  
  // Actions
  processCodebase: (options?: any) => Promise<EmbeddingResult>;
  searchCode: (query: string, options?: any) => Promise<SearchResult[]>;
  getFileData: (filePath: string) => Promise<any>;
  listFiles: (filters?: any) => Promise<any[]>;
  getMetadata: () => Promise<{ categories: string[]; languages: string[] }>;
  healthCheck: () => Promise<{ status: string; embeddingsCount: number }>;
  clearError: () => void;
}

export const useApplicationEmbeddings = (): UseApplicationEmbeddingsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const embeddingsService = ApplicationEmbeddingsService.getInstance();

  const processCodebase = useCallback(async (options: any = {}): Promise<EmbeddingResult> => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await embeddingsService.processApplicationCodebase(options);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
      // Reset progress after a delay
      setTimeout(() => setProcessingProgress(0), 2000);
    }
  }, [embeddingsService]);

  const searchCode = useCallback(async (
    query: string, 
    options: any = {}
  ): Promise<SearchResult[]> => {
    if (!query.trim()) {
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await embeddingsService.searchCode(query, options);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [embeddingsService]);

  const getFileData = useCallback(async (filePath: string) => {
    setError(null);
    
    try {
      return await embeddingsService.getFileData(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get file data';
      setError(errorMessage);
      throw error;
    }
  }, [embeddingsService]);

  const listFiles = useCallback(async (filters: any = {}) => {
    setError(null);
    
    try {
      return await embeddingsService.listProcessedFiles(filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
      setError(errorMessage);
      throw error;
    }
  }, [embeddingsService]);

  const getMetadata = useCallback(async () => {
    setError(null);
    
    try {
      return await embeddingsService.getMetadata();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get metadata';
      setError(errorMessage);
      throw error;
    }
  }, [embeddingsService]);

  const healthCheck = useCallback(async () => {
    setError(null);
    
    try {
      return await embeddingsService.healthCheck();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setError(errorMessage);
      throw error;
    }
  }, [embeddingsService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isProcessing,
    isSearching,
    processingProgress,
    error,
    
    // Actions
    processCodebase,
    searchCode,
    getFileData,
    listFiles,
    getMetadata,
    healthCheck,
    clearError
  };
};