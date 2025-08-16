import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMicroservices } from '@/hooks/admin/useMicroservices';
import { toast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const AddMicroserviceForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    port: '',
    version: '1.0.0',
    status: 'stopped' as 'running' | 'stopped' | 'error',
    description: '',
    healthCheckPath: '/health'
  });

  const { addMicroservice, refetch } = useMicroservices();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.port) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addMicroservice({
        name: formData.name,
        port: parseInt(formData.port),
        version: formData.version,
        status: formData.status,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Microservice added successfully",
        });
        
        // Reset form
        setFormData({
          name: '',
          port: '',
          version: '1.0.0',
          status: 'stopped',
          description: '',
          healthCheckPath: '/health'
        });
        
        // Refresh the list
        await refetch();
      } else {
        throw new Error('Failed to add microservice');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add microservice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Microservice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input 
                id="name" 
                placeholder="Enter service name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="port">Port *</Label>
              <Input 
                id="port" 
                type="number" 
                placeholder="Enter port number"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                disabled={isSubmitting}
                min="1"
                max="65535"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version">Version</Label>
              <Input 
                id="version" 
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="status">Initial Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'running' | 'stopped' | 'error') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="healthCheck">Health Check Path</Label>
            <Input 
              id="healthCheck" 
              placeholder="/health"
              value={formData.healthCheckPath}
              onChange={(e) => setFormData(prev => ({ ...prev, healthCheckPath: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Optional description of the microservice"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Service...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddMicroserviceForm;