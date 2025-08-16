import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Video, FileText, Users, Download } from 'lucide-react';

const ResourcesPage: React.FC = () => {
  const resources = [
    {
      title: "Startup Guides",
      description: "Comprehensive guides for starting your business",
      icon: BookOpen,
      items: [
        { name: "Business Model Canvas", url: "#", type: "guide" },
        { name: "Market Research 101", url: "#", type: "guide" },
        { name: "Funding Your Startup", url: "#", type: "guide" },
        { name: "Legal Basics", url: "#", type: "guide" }
      ]
    },
    {
      title: "Video Tutorials",
      description: "Learn with step-by-step video content",
      icon: Video,
      items: [
        { name: "Competitor Analysis Walkthrough", url: "#", type: "video" },
        { name: "Using AI for Market Research", url: "#", type: "video" },
        { name: "Building Your MVP", url: "#", type: "video" },
        { name: "Pitch Deck Essentials", url: "#", type: "video" }
      ]
    },
    {
      title: "Templates & Tools",
      description: "Ready-to-use templates and spreadsheets",
      icon: FileText,
      items: [
        { name: "Business Plan Template", url: "#", type: "template" },
        { name: "Financial Model Spreadsheet", url: "#", type: "template" },
        { name: "Competitor Analysis Template", url: "#", type: "template" },
        { name: "Customer Survey Template", url: "#", type: "template" }
      ]
    },
    {
      title: "Community & Support",
      description: "Connect with other entrepreneurs",
      icon: Users,
      items: [
        { name: "Entrepreneur Forum", url: "#", type: "community" },
        { name: "Weekly Office Hours", url: "#", type: "community" },
        { name: "Success Stories", url: "#", type: "community" },
        { name: "Help Center", url: "#", type: "support" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground">
          Access guides, templates, and tools to help build your business
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {category.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Button size="sm" variant="ghost" disabled>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Resources coming soon! We're building a comprehensive library for entrepreneurs.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;