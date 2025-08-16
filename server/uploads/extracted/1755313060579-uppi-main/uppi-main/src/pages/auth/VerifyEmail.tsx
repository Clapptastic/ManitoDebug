
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Email Verified</h1>
      <p className="text-muted-foreground mb-6">
        Your email has been successfully verified. You can now access all features of the platform.
      </p>
      
      <Button asChild className="w-full">
        <Link to="/dashboard">Continue to Dashboard</Link>
      </Button>
    </div>
  );
};

export default VerifyEmail;
