import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BusinessPlanGenerator } from '@/components/business-tools/BusinessPlanGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BusinessPlanPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the business plan generator
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')}>
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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Business Plan Generator</h1>
            <p className="text-muted-foreground">
              Create comprehensive business plans with AI-powered insights and strategic guidance
            </p>
          </div>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Comprehensive Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generate detailed business plans with executive summaries, market analysis, and financial projections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                AI-powered market research and competitive analysis integrated into your business plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Financial Modeling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Automated financial forecasts, revenue models, and funding requirements analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Team & Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Organizational structure, hiring plans, and operational strategy recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Business Plan Generator Component */}
        <BusinessPlanGenerator />
      </div>
    </div>
  );
};

export default BusinessPlanPage;