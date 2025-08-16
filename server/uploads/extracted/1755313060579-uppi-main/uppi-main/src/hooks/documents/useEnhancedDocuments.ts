/**
 * Enhanced Documents Hook
 * Provides comprehensive document management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  enhancedDocumentService, 
  DocumentUploadOptions, 
  DocumentSearchOptions 
} from '@/services/documents/enhancedDocumentService';

export interface UseEnhancedDocumentsReturn {
  documents: any[];
  analytics: any | null;
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, options: DocumentUploadOptions) => Promise<string | null>;
  searchDocuments: (options?: DocumentSearchOptions) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocumentUrl: (documentId: string) => Promise<string | null>;
  refreshDocuments: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

export const useEnhancedDocuments = (): UseEnhancedDocumentsReturn => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(async (
    file: File, 
    options: DocumentUploadOptions
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const documentId = await enhancedDocumentService.uploadDocument(file, options);
      await refreshDocuments(); // Refresh the list after upload
      return documentId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchDocuments = useCallback(async (options?: DocumentSearchOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await enhancedDocumentService.searchDocuments(options);
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await enhancedDocumentService.deleteDocument(documentId);
      await refreshDocuments(); // Refresh the list after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocumentUrl = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      return await enhancedDocumentService.getDocumentUrl(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document URL');
      return null;
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await enhancedDocumentService.searchDocuments();
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      const analyticsData = await enhancedDocumentService.getDocumentAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load document analytics:', err);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
    refreshAnalytics();
  }, [refreshDocuments, refreshAnalytics]);

  return {
    documents,
    analytics,
    isLoading,
    error,
    uploadDocument,
    searchDocuments,
    deleteDocument,
    getDocumentUrl,
    refreshDocuments,
    refreshAnalytics
  };
};