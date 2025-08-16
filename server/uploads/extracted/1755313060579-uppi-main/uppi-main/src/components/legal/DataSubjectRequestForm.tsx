import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Trash2, Edit, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DataSubjectRequestForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    request_type: '',
    request_details: ''
  });
  const { toast } = useToast();

  const requestTypes = [
    {
      value: 'access',
      label: 'Data Access Request',
      description: 'Request a copy of all personal data we hold about you',
      icon: FileText
    },
    {
      value: 'rectification',
      label: 'Data Correction Request',
      description: 'Request correction of inaccurate or incomplete personal data',
      icon: Edit
    },
    {
      value: 'erasure',
      label: 'Data Deletion Request',
      description: 'Request deletion of your personal data (Right to be Forgotten)',
      icon: Trash2
    },
    {
      value: 'portability',
      label: 'Data Portability Request',
      description: 'Request your data in a portable format to transfer to another service',
      icon: Download
    },
    {
      value: 'restriction',
      label: 'Processing Restriction Request',
      description: 'Request to limit how we process your personal data',
      icon: Shield
    },
    {
      value: 'objection',
      label: 'Processing Objection',
      description: 'Object to the processing of your personal data',
      icon: Shield
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to submit a data subject request.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('data_subject_requests')
        .insert([{
          user_id: user.id,
          request_type: formData.request_type,
          request_details: { details: formData.request_details },
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your data subject request has been submitted successfully. We will process it within 30 days as required by GDPR.'
      });

      setFormData({
        request_type: '',
        request_details: ''
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRequestType = requestTypes.find(type => type.value === formData.request_type);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Subject Rights Request</h2>
        <p className="text-muted-foreground">
          Exercise your rights under GDPR to control how your personal data is processed.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your Privacy Rights:</strong> Under GDPR, you have the right to access, correct, delete, 
          or restrict the processing of your personal data. We will respond to your request within 30 days.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Data Subject Request</CardTitle>
          <CardDescription>
            Select the type of request you'd like to make regarding your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="request_type">Request Type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value) => setFormData({ ...formData, request_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a request type" />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRequestType && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedRequestType.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="request_details">Additional Details</Label>
              <Textarea
                id="request_details"
                value={formData.request_details}
                onChange={(e) => setFormData({ ...formData, request_details: e.target.value })}
                placeholder="Please provide any additional details about your request..."
                rows={5}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Provide specific details about your request to help us process it more efficiently.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !formData.request_type}
              className="w-full"
            >
              {loading ? 'Submitting Request...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {requestTypes.map((type) => (
          <Card key={type.value} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <type.icon className="h-5 w-5" />
                {type.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {type.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Request Submitted</p>
                <p className="text-sm text-muted-foreground">Your request is received and logged in our system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">We verify your identity to protect your data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Processing (up to 30 days)</p>
                <p className="text-sm text-muted-foreground">We process your request according to GDPR requirements</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Response Delivered</p>
                <p className="text-sm text-muted-foreground">You receive the response via email or secure download</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};