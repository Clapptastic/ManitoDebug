/**
 * Enhanced Document Service
 * Comprehensive document management with processing and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';
import { enhancedAnalyticsService } from '../analytics/enhancedAnalyticsService';

export interface DocumentUploadOptions {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface DocumentSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface DocumentProcessingResult {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedText?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export class EnhancedDocumentService {
  private static instance: EnhancedDocumentService;

  public static getInstance(): EnhancedDocumentService {
    if (!EnhancedDocumentService.instance) {
      EnhancedDocumentService.instance = new EnhancedDocumentService();
    }
    return EnhancedDocumentService.instance;
  }

  async uploadDocument(
    file: File, 
    options: DocumentUploadOptions
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: options.title,
          description: options.description,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          tags: options.tags || []
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Track analytics
      await enhancedAnalyticsService.trackUserAction('document_uploaded', {
        document_id: document.id,
        file_type: file.type,
        file_size: file.size,
        category: options.category
      });

      // Trigger document processing
      this.processDocument(document.id, filePath);

      return document.id;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Document upload failed');
      throw error;
    }
  }

  async processDocument(documentId: string, filePath: string): Promise<void> {
    try {
      // Call document processing edge function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId, filePath }
      });

      if (error) {
        console.error('Document processing failed:', error);
        return;
      }

      // Update document with processing results
      await supabase
        .from('documents')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

    } catch (error) {
      console.error('Document processing error:', error);
    }
  }

  async searchDocuments(options: DocumentSearchOptions = {}): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options.query) {
        query = query.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Track search analytics
      await enhancedAnalyticsService.trackUserAction('documents_searched', {
        query: options.query,
        category: options.category,
        results_count: data?.length || 0
      });

      return data || [];
    } catch (error) {
      standardErrorHandler.handleError(error, 'Document search failed');
      return [];
    }
  }

  async getDocument(documentId: string): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get document');
      return null;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get document info first
      const document = await this.getDocument(documentId);
      if (!document) throw new Error('Document not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) console.warn('Storage deletion failed:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Track analytics
      await enhancedAnalyticsService.trackUserAction('document_deleted', {
        document_id: documentId,
        file_type: document.file_type
      });

    } catch (error) {
      standardErrorHandler.handleError(error, 'Document deletion failed');
      throw error;
    }
  }

  async getDocumentUrl(documentId: string): Promise<string | null> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return null;

      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      return urlData?.signedUrl || null;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get document URL');
      return null;
    }
  }

  async getDocumentAnalytics(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: documents } = await supabase
        .from('documents')
        .select('file_type, file_size, created_at')
        .eq('user_id', user.id);

      if (!documents) return null;

      const analytics = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
        byFileType: this.groupBy(documents, 'file_type'),
        uploadTrend: this.groupByMonth(documents)
      };

      return analytics;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get document analytics');
      return null;
    }
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const value = item[key] || 'unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  private groupByMonth(array: any[]): any[] {
    const grouped = array.reduce((result, item) => {
      const month = new Date(item.created_at).toISOString().slice(0, 7);
      if (!result[month]) {
        result[month] = { month, count: 0 };
      }
      result[month].count++;
      return result;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }
}

export const enhancedDocumentService = EnhancedDocumentService.getInstance();