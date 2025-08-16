/**
 * Support Dashboard Component
 * Main dashboard for customer support system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  BookOpen,
  TrendingUp,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService } from '@/services/supportService';
import type { SupportDashboardData, SupportTicket, KnowledgeBaseArticle } from '@/types/support';
import { TicketList } from './TicketList';
import { CreateTicketDialog } from './CreateTicketDialog';
import { KnowledgeBaseSection } from './KnowledgeBaseSection';

export const SupportDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SupportDashboardData | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await supportService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (ticket: SupportTicket) => {
    setTickets(prev => [ticket, ...prev]);
    setShowCreateTicket(false);
    toast({
      title: 'Success',
      description: 'Support ticket created successfully'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading support dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
            <p className="text-muted-foreground">
              Get help, browse documentation, and manage your support tickets
            </p>
          </div>
          <Button onClick={() => setShowCreateTicket(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
            <TabsTrigger value="help">Quick Help</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Open Tickets</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active support requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.tickets.first_response_time || '< 1 hour'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Typical first response
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.knowledge_base.published_articles || knowledgeBase.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Help articles available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.satisfaction.score || '4.8'}/5
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer satisfaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Your latest support requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {ticket.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          ticket.status === 'resolved' ? 'default' :
                          ticket.status === 'in_progress' ? 'secondary' :
                          'outline'
                        }>
                          {ticket.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Articles</CardTitle>
                  <CardDescription>Most helpful knowledge base articles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {knowledgeBase.slice(0, 5).map((article) => (
                      <div key={article.id} className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {article.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {article.category} • {article.view_count} views
                          </p>
                        </div>
                        {article.helpfulness_score !== undefined && (
                          <Badge variant="outline">
                            {Math.round(article.helpfulness_score)}% helpful
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <TicketList 
              tickets={tickets} 
              onTicketUpdate={loadDashboardData}
              showCreateButton={false}
            />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <KnowledgeBaseSection />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common support tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowCreateTicket(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Report a Bug
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('knowledge-base')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Documentation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('mailto:support@uppi.ai')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Contact Support Team
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">All systems operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">API services running normally</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Support team available</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date().toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showCreateTicket && (
        <CreateTicketDialog
          open={showCreateTicket}
          onClose={() => setShowCreateTicket(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  );
};