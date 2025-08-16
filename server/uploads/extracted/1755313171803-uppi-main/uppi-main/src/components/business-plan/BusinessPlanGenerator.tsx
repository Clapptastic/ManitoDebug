import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Lightbulb } from 'lucide-react';

export const BusinessPlanGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    businessModel: ''
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateBusinessPlan = async () => {
    if (!formData.businessName || !formData.industry || !formData.businessModel) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('business-plan-generator', {
        body: formData
      });

      if (error) throw error;

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: 'Business Plan Generated',
        description: 'Your comprehensive business plan is ready!',
      });
    } catch (error) {
      console.error('Error generating business plan:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate business plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            AI Business Plan Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            />
            <Input
              placeholder="Industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            />
            <Input
              placeholder="Business Model"
              value={formData.businessModel}
              onChange={(e) => setFormData(prev => ({ ...prev, businessModel: e.target.value }))}
            />
          </div>

          <Button onClick={generateBusinessPlan} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Business Plan...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate AI Business Plan
              </>
            )}
          </Button>

          {loading && <Progress value={progress} className="w-full" />}
        </CardContent>
      </Card>
    </div>
  );
};