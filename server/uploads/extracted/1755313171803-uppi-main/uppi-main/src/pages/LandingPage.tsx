import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Beta Access Available
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Entrepreneurship Platform
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automate your startup journey with intelligent market research, competitor analysis, 
            and business plan generation powered by cutting-edge AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth/beta-signup">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="h-4 w-4 mr-2" />
                Join Beta Program
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            
            <Link to="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI Market Research</CardTitle>
              <CardDescription>
                Automated competitor analysis and market validation with real-time insights
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart Business Plans</CardTitle>
              <CardDescription>
                Generate comprehensive business plans tailored to your industry and goals
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Entrepreneur AI Chat</CardTitle>
              <CardDescription>
                Get personalized guidance and answers from our specialized AI advisor
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Beta Program Benefits */}
        <Card className="max-w-3xl mx-auto border-primary/20 bg-gradient-to-r from-primary/5 to-background">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Why Join Our Beta?</CardTitle>
            <CardDescription>
              Get early access to revolutionary entrepreneurship tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Free Beta Access</h4>
                  <p className="text-sm text-muted-foreground">Full platform access during beta period</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-sm text-muted-foreground">Direct line to our development team</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Shape the Product</h4>
                  <p className="text-sm text-muted-foreground">Your feedback directly influences features</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Exclusive Pricing</h4>
                  <p className="text-sm text-muted-foreground">Lock in special beta user pricing</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link to="/auth/beta-signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Your Beta Journey
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;