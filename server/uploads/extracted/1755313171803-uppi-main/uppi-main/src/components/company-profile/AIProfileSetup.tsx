import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Globe, 
  Brain, 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Bot,
  Search,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StreamUpdate {
  step: string;
  status: 'starting' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
  data?: any;
}

interface AIProfileSetupProps {
  onProfileCreated?: (profile: any) => void;
  onCancel?: () => void;
}

export const AIProfileSetup: React.FC<AIProfileSetupProps> = ({
  onProfileCreated,
  onCancel
}) => {
  const { user } = useAuth();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<StreamUpdate | null>(null);
  const [completedSteps, setCompletedSteps] = useState<StreamUpdate[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const steps = [
    { 
      key: 'website_scraping', 
      label: 'Website Analysis', 
      icon: Globe,
      description: 'Extracting company information from website'
    },
    { 
      key: 'openai_analysis', 
      label: 'AI Business Analysis', 
      icon: Brain,
      description: 'Analyzing business model and strategy'
    },
    { 
      key: 'anthropic_analysis', 
      label: 'Market Intelligence', 
      icon: TrendingUp,
      description: 'Gathering market insights and positioning'
    },
    { 
      key: 'data_consolidation', 
      label: 'Data Processing', 
      icon: Database,
      description: 'Consolidating and structuring information'
    },
    { 
      key: 'database_save', 
      label: 'Profile Creation', 
      icon: Building2,
      description: 'Saving your company profile'
    }
  ];

  const handleStartSetup = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: 'Website URL Required',
        description: 'Please enter your company website URL',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep(null);
    setProgress(0);

    try {
      // Start the streaming setup process, authenticated with user JWT
      const projectId = 'jqbdjttdaihidoyalqvs';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo';

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('Missing auth session');
      }
      
      const response = await fetch(`https://${projectId}.functions.supabase.co/ai-profile-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': anonKey
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          companyName: companyName.trim() || undefined,
          industry: industry.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Setup failed: ${response.status}`);
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              setIsProcessing(false);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const update: StreamUpdate = JSON.parse(line.slice(6));
                  console.log('Stream update:', update);

                  setCurrentStep(update);
                  setProgress(update.progress);

                  if (update.status === 'completed') {
                    setCompletedSteps(prev => [...prev, update]);
                    
                    if (update.step === 'completed') {
                      // Setup completed successfully
                      toast({
                        title: 'Profile Setup Complete!',
                        description: 'Your AI-powered company profile has been created',
                      });
                      
                      if (onProfileCreated && update.data?.profile) {
                        onProfileCreated(update.data.profile);
                      }
                      
                      setIsProcessing(false);
                      return;
                    }
                  } else if (update.status === 'error') {
                    setError(update.message);
                    setIsProcessing(false);
                    return;
                  }
                } catch (parseErr) {
                  console.error('Error parsing stream data:', parseErr);
                }
              }
            }
          }
        } catch (streamErr) {
          console.error('Stream reading error:', streamErr);
          setError('Connection to setup service lost');
          setIsProcessing(false);
        }
      };

      readStream();


    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to start profile setup');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setCurrentStep(null);
    setCompletedSteps([]);
    setProgress(0);
    setError(null);
    
    if (onCancel) {
      onCancel();
    }
  };

  const getStepStatus = (stepKey: string) => {
    if (completedSteps.some(s => s.step === stepKey)) return 'completed';
    if (currentStep?.step === stepKey) return 'processing';
    return 'pending';
  };

  const getStepIcon = (step: any, status: string) => {
    const IconComponent = step.icon;
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'processing') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    return <IconComponent className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-gradient">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">AI-Powered Profile Setup</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Let our AI analyze your website and create a comprehensive company profile automatically
          </p>
        </CardHeader>
      </Card>

      {/* Input Form */}
      {!isProcessing && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website-url">Company Website URL *</Label>
              <Input
                id="website-url"
                type="url"
                placeholder="https://www.yourcompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name (Optional)</Label>
                <Input
                  id="company-name"
                  placeholder="Your Company Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Input
                  id="industry"
                  placeholder="Technology, Healthcare, etc."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleStartSetup}
                className="flex-1"
                size="lg"
              >
                <Bot className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
              {onCancel && (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  size="lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Steps */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Setup Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* Step Details */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.key);
                
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-4 p-4 rounded-lg border ${
                      status === 'completed' ? 'bg-green-50 border-green-200' :
                      status === 'processing' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getStepIcon(step, status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{step.label}</h4>
                        <Badge variant={
                          status === 'completed' ? 'default' :
                          status === 'processing' ? 'secondary' :
                          'outline'
                        }>
                          {status === 'completed' ? 'Complete' :
                           status === 'processing' ? 'Processing' :
                           'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {status === 'processing' && currentStep?.message || step.description}
                      </p>
                      
                      {/* Show extracted data */}
                      {status === 'completed' && completedSteps.find(s => s.step === step.key)?.data && (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ {JSON.stringify(completedSteps.find(s => s.step === step.key)?.data?.extractedInfo || 'Data processed successfully').slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Current Status Message */}
            <AnimatePresence>
              {currentStep && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      {currentStep.message}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cancel Button */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};