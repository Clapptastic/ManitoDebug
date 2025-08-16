import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface SystemStatusNotificationProps {
  className?: string;
}

export const SystemStatusNotification: React.FC<SystemStatusNotificationProps> = ({ className }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800">System Updated</AlertTitle>
        <AlertDescription className="text-emerald-700">
          ✅ Database RLS policies fixed - API usage tracking now works properly
          <br />
          ✅ Legacy edge functions removed - codebase cleaned up
          <br />
          ✅ API key vault system operational with secure encryption
          <br />
          ✅ All edge functions updated to use the latest vault system
        </AlertDescription>
      </Alert>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Next Steps Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          🔑 Please add your API keys using the secure form below
          <br />
          🔍 Once added, all AI features (competitor analysis, market research, etc.) will work
          <br />
          🔒 Your API keys are now encrypted using Supabase Vault for maximum security
        </AlertDescription>
      </Alert>
    </div>
  );
};