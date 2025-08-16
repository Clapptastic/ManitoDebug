import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, MessageSquare, Users, Zap } from 'lucide-react';

const AIChatDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Chat System</h2>
          <p className="text-muted-foreground">
            Intelligent business guidance and automation
          </p>
        </div>
        <Button>
          <MessageSquare className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">-0.3s improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Planning Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              AI-powered guidance for business strategy, planning, and execution.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Strategy</Badge>
              <Badge variant="secondary">Financial Planning</Badge>
              <Badge variant="secondary">Market Analysis</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitive Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get insights on competitors, market positioning, and opportunities.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Competitor Analysis</Badge>
              <Badge variant="secondary">Market Intelligence</Badge>
              <Badge variant="secondary">SWOT Analysis</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: "John Doe", message: "Help me analyze my startup's market position", time: "2 minutes ago", status: "active" },
              { user: "Jane Smith", message: "What are the key metrics for SaaS businesses?", time: "15 minutes ago", status: "completed" },
              { user: "Mike Johnson", message: "Competitive analysis for e-commerce platform", time: "1 hour ago", status: "completed" }
            ].map((conv, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{conv.user}</span>
                    <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                      {conv.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{conv.message}</p>
                </div>
                <div className="text-xs text-muted-foreground">{conv.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatDashboard;