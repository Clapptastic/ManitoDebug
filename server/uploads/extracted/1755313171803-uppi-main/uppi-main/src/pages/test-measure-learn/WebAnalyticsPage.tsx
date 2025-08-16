
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard';
import { supabase } from '@/integrations/supabase/client';

const WebAnalyticsPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user's websites when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchWebsites = async () => {
        try {
          // Mock data since analytics_websites table doesn't exist
          const websites = [];
          const error = null;
          setWebsites([]);
        } catch (err: any) {
          setError(err.message || 'Failed to load websites');
          console.error('Error loading websites:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchWebsites();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  if (loading || isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="h-8 w-8 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Please log in to access Web Analytics</h2>
        <Button onClick={() => navigate('/login', { state: { from: '/test-measure-learn/web-analytics' } })}>
          Log In
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold text-red-500">Error loading analytics</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }
  
  return <AdvancedAnalyticsDashboard />;
};

export default WebAnalyticsPage;
