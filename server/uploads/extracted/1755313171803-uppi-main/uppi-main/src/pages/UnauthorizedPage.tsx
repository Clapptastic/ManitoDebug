
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <ShieldX className="h-24 w-24 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold">Unauthorized</h1>
        <h2 className="text-xl">You don't have permission to access this page</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Please contact your administrator if you believe this is a mistake.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
