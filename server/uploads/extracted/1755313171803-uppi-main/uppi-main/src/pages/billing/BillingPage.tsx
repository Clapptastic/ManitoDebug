/**
 * Billing Page - Main billing and subscription management interface
 * Comprehensive page for Phase 10 implementation
 */

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CreditCard className="w-12 h-12 text-primary" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access your billing and subscription information.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BillingDashboard userId={user.id} />
      </div>
    </div>
  );
};