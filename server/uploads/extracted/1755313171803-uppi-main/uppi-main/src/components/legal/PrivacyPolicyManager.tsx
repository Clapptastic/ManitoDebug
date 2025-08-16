import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, Edit, Plus, Download, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const PrivacyPolicyManager: React.FC = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    document_type: 'privacy_policy',
    title: '',
    content: '',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch legal documents.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDocument) {
        // Update existing document
        const { error } = await supabase
          .from('legal_documents')
          .update({
            ...formData,
            effective_date: new Date(formData.effective_date).toISOString()
          })
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Legal document updated successfully.'
        });
      } else {
        // Create new document
        const { error } = await supabase
          .from('legal_documents')
          .insert([{
            ...formData,
            effective_date: new Date(formData.effective_date).toISOString()
          }]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Legal document created successfully.'
        });
      }

      setFormData({
        document_type: 'privacy_policy',
        title: '',
        content: '',
        version: '1.0',
        effective_date: new Date().toISOString().split('T')[0]
      });
      setIsCreateDialogOpen(false);
      setEditingDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: 'Failed to save legal document.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateDocument = async (documentId: string) => {
    try {
      // First deactivate all documents of the same type
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      await supabase
        .from('legal_documents')
        .update({ is_active: false })
        .eq('document_type', document.document_type);

      // Then activate the selected document
      const { error } = await supabase
        .from('legal_documents')
        .update({ is_active: true })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document activated successfully.'
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error activating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate document.',
        variant: 'destructive'
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'privacy_policy': return 'Privacy Policy';
      case 'terms_of_service': return 'Terms of Service';
      case 'cookie_policy': return 'Cookie Policy';
      default: return type;
    }
  };

  const getBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  if (loading && documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading legal documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Privacy Policy & Legal Documents</h2>
          <p className="text-muted-foreground">Manage your legal documents and compliance policies</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDocument(null);
              setFormData({
                document_type: 'privacy_policy',
                title: '',
                content: '',
                version: '1.0',
                effective_date: new Date().toISOString().split('T')[0]
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Legal Document' : 'Create Legal Document'}
              </DialogTitle>
              <DialogDescription>
                Create or edit legal documents for your platform compliance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document_type">Document Type</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privacy_policy">Privacy Policy</SelectItem>
                      <SelectItem value="terms_of_service">Terms of Service</SelectItem>
                      <SelectItem value="cookie_policy">Cookie Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter document title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter document content..."
                  rows={12}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingDocument ? 'Update Document' : 'Create Document'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {document.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant={getBadgeVariant(document.is_active)}>
                      {getDocumentTypeLabel(document.document_type)}
                    </Badge>
                    <span>Version {document.version}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Effective: {new Date(document.effective_date).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!document.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivateDocument(document.id)}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDocument(document);
                      setFormData({
                        document_type: document.document_type,
                        title: document.title,
                        content: document.content,
                        version: document.version,
                        effective_date: new Date(document.effective_date).toISOString().split('T')[0]
                      });
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {document.content.substring(0, 200)}...
                </p>
              </div>
              {document.is_active && (
                <Badge className="mt-2" variant="default">
                  Currently Active
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}

        {documents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Legal Documents</h3>
              <p className="text-muted-foreground mb-4">
                Create your first legal document to ensure compliance.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};