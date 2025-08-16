import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TypeCoverageDashboard from '@/components/admin/type-coverage/TypeCoverageDashboard';
import { Helmet } from 'react-helmet-async';

const TypeCoveragePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Type Coverage Analysis | Admin</title>
        <meta name="description" content="Analyze TypeScript type coverage and issues across the codebase." />
        <link rel="canonical" href="/admin/type-coverage" />
      </Helmet>
      <main className="container mx-auto px-4 py-8 space-y-6" role="main">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Type Coverage Analysis</h1>
            <p className="text-muted-foreground">
              Monitor TypeScript coverage and type safety across your codebase
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        {/* Main Content */}
        <TypeCoverageDashboard />
      </main>
    </>
  );
};

export default TypeCoveragePage;