import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface DocumentViewerProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, onClose }) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (error) throw error;
        setDocument(data);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(error instanceof Error ? error.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPreviewable = (fileType: string) => {
    return fileType.includes('image') || fileType.includes('pdf') || fileType.includes('text');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh]">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error || 'Document not found'}</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">{document.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{document.file_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(document.file_path, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(document.file_path, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 overflow-hidden">
          {/* Document Info */}
          <div className="p-6 border-b">
            {document.description && (
              <p className="text-sm text-muted-foreground mb-3">{document.description}</p>
            )}
            
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Created: {new Date(document.created_at).toLocaleString()}
            </div>
          </div>

          {/* Document Preview */}
          <div className="h-96 overflow-auto">
            {isPreviewable(document.file_type) ? (
              <div className="p-4">
                {document.file_type.includes('image') ? (
                  <img 
                    src={document.file_path} 
                    alt={document.name}
                    className="max-w-full h-auto mx-auto"
                  />
                ) : document.file_type.includes('pdf') ? (
                  <iframe
                    src={document.file_path}
                    className="w-full h-full border-0"
                    title={document.name}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Preview not available for this file type</p>
                    <p className="text-sm">Use the download or open buttons above to view the document</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Preview not available for this file type</p>
                <p className="text-sm">Use the download or open buttons above to view the document</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};