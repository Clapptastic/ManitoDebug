
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

/**
 * Developer Home Page Component
 * 
 * This page provides access to development tools and utilities
 */
const DevHomePage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Development Tools</h1>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Developer Mode</div>
      </div>
      
      <p className="text-muted-foreground mb-8">
        These tools are only available in development mode and help with debugging and testing.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Database Schema Viewer</CardTitle>
            <CardDescription>
              Explore the database structure and relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dev/schema-viewer">
              <Button variant="outline" className="w-full">
                Open Schema Viewer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>API Explorer</CardTitle>
            <CardDescription>
              Test API endpoints and view documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dev/api-explorer">
              <Button variant="outline" className="w-full">
                Open API Explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Component Gallery</CardTitle>
            <CardDescription>
              View and test UI components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dev/component-gallery">
              <Button variant="outline" className="w-full">
                Open Component Gallery
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Environment</div>
            <div className="font-medium">Development</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Version</div>
            <div className="font-medium">1.0.0</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">React</div>
            <div className="font-medium">{React.version}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Build Date</div>
            <div className="font-medium">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevHomePage;
