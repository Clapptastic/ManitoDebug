import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketDetailDialog } from '@/components/support/TicketDetailDialog';
import { supportTicketService } from '@/services/supportTicketService';
import type { SupportTicket as ServiceSupportTicket } from '@/services/supportTicketService';
import type { SupportTicket } from '@/types/support';
import { toast } from 'sonner';

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    if (!ticketId) return;
    
    try {
      setLoading(true);
      const ticketData = await supportTicketService.getTicketById(ticketId);
      if (ticketData) {
        // Convert service type to component type
        const convertedTicket: SupportTicket = {
          ...ticketData,
          status: ticketData.status as any,
          priority: ticketData.priority as any,
          category: (ticketData.category as any) || 'general',
          assigned_to: ticketData.assigned_to || null,
          resolution: null,
          tags: [],
          resolved_at: null
        };
        setTicket(convertedTicket);
      } else {
        toast.error('Ticket not found');
        navigate('/support');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
      navigate('/support');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketUpdate = () => {
    if (ticketId) {
      loadTicket();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Ticket not found</h3>
            <p className="text-muted-foreground mb-6">
              The requested ticket could not be found.
            </p>
            <Button onClick={() => navigate('/support')}>
              Back to Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/support')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Button>
      </div>

      <TicketDetailDialog
        ticket={ticket}
        open={true}
        onClose={() => navigate('/support')}
        onTicketUpdate={handleTicketUpdate}
      />
    </div>
  );
};

export default TicketDetailPage;