import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKeySetupBannerProps {
  hasWorkingKeys: boolean;
  workingApis: string[];
  totalApis: number;
}

export const ApiKeySetupBanner: React.FC<ApiKeySetupBannerProps> = ({
  hasWorkingKeys,
  workingApis,
  totalApis
}) => {
  const navigate = useNavigate();

  if (hasWorkingKeys) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                API Keys Ready ({workingApis.length}/{totalApis})
              </p>
              <p className="text-sm text-green-600">
                Working APIs: {workingApis.join(', ')}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/api-keys')}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Keys
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              API Keys Required
            </p>
            <p className="text-sm text-yellow-600">
              Add at least one API key to start competitor analysis
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/api-keys')}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Key className="h-4 w-4 mr-2" />
          Setup API Keys
        </Button>
      </CardContent>
    </Card>
  );
};