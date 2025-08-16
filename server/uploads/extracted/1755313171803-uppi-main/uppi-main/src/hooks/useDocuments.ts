import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  file_size: number;
  file_path: string;
  tags?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File, metadata?: any) => {
    try {
      setLoading(true);
      
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save document metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: publicUrl,
          metadata: metadata || {},
          description: metadata?.description,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      // Delete from storage
      const fileName = document.file_path.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('documents')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  }, [documents]);

  const searchDocuments = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to search documents',
        variant: 'destructive',
      });
      return [];
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    searchDocuments,
    refreshDocuments: fetchDocuments
  };
};