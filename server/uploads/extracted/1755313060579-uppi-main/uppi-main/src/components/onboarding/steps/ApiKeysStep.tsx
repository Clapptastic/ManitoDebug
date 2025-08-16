import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKeysStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const ApiKeysStep: React.FC<ApiKeysStepProps> = ({ 
  data, 
  onUpdate,
  onNext 
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const apiProviders = [
    {
      name: 'OpenAI',
      description: 'Powers competitor analysis and market insights',
      required: true,
      icon: '🤖'
    },
    {
      name: 'Anthropic Claude',
      description: 'Alternative AI provider for enhanced analysis',
      required: false,
      icon: '🧠'
    },
    {
      name: 'Google Gemini',
      description: 'Additional AI capabilities and data sources',
      required: false,
      icon: '✨'
    }
  ];

  const handleSetupApiKeys = () => {
    setIsNavigating(true);
    // Navigate to API keys page in a new tab/window so they can come back
    window.open('/api-keys', '_blank');
    // Mark as setup initiated
    onUpdate({ apiKeysSetup: true });
  };

  const handleSkipApiKeys = () => {
    onUpdate({ apiKeysSetup: false });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Connect Your AI Providers</h2>
        <p className="text-muted-foreground">
          Connect your API keys to unlock powerful AI-driven insights. You can also set these up later.
        </p>
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Secure & Private
          </CardTitle>
          <CardDescription>
            Your API keys are encrypted and stored securely. We never see or store your actual keys in plain text.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Available AI Providers</h3>
        
        {apiProviders.map((provider, index) => (
          <Card key={provider.name} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{provider.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{provider.name}</h4>
                      {provider.required && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
                
                {provider.required && (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Why do I need API keys?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Enable AI-powered competitor analysis</li>
                  <li>• Access real-time market insights</li>
                  <li>• Generate detailed business reports</li>
                  <li>• Get personalized recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          onClick={handleSetupApiKeys}
          className="flex items-center gap-2 flex-1"
          disabled={isNavigating}
        >
          <Key className="w-4 h-4" />
          Set Up API Keys Now
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSkipApiKeys}
          className="flex-1"
        >
          Skip for Now
        </Button>
      </div>

      {data.apiKeysSetup && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Great! You can continue with the setup. Your API keys will be available once configured.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};