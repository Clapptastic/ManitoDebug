
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth/useAuth';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome to Uppi AI Platform</h1>
        <p className="text-xl mb-8 text-muted-foreground">
          The AI-powered platform that helps you automate your entrepreneurial journey
        </p>
        
        {!isAuthenticated ? (
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </div>
        ) : (
          <Button size="lg" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">AI-Powered Research</h2>
          <p className="text-muted-foreground">
            Leverage advanced AI to conduct market research and gain competitive insights.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">Smart Analytics</h2>
          <p className="text-muted-foreground">
            Track your business performance with intelligent analytics and reporting.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">Process Optimization</h2>
          <p className="text-muted-foreground">
            Streamline your workflows and improve efficiency with AI-driven suggestions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
