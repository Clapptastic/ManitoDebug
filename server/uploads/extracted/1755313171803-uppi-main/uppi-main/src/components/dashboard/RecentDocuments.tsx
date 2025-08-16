import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { dataManager } from '@/services/core/DataManager';
import { useAuth } from '@/hooks/auth/useAuth';
import { Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';

export const RecentDocuments: React.FC = () => {
  const { user } = useAuth();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['recent-documents', user?.id],
    queryFn: () => dataManager.fetchData('documents', {
      filters: { user_id: user?.id },
      select: 'id,name,file_type,file_size,created_at',
      orderBy: { column: 'created_at', ascending: false },
      limit: 5
    }),
    enabled: !!user?.id
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Documents
        </CardTitle>
        <CardDescription>
          Recently uploaded files and documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No documents found</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your first document to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>
                <Badge variant="outline">
                  {doc.file_type?.toUpperCase() || 'FILE'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};