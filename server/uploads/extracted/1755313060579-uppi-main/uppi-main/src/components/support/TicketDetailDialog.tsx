/**
 * Ticket Detail Dialog Component
 * Shows ticket details and allows messaging
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Send,
  Calendar,
  Tag
} from 'lucide-react';
import type { 
  SupportTicket, 
  SupportTicketMessage,
  CreateMessageRequest 
} from '@/types/support';
import { 
  TICKET_STATUS_COLORS, 
  TICKET_PRIORITY_COLORS 
} from '@/types/support';
import { supportService } from '@/services/supportService';
import { toast } from 'sonner';

interface TicketDetailDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onClose: () => void;
  onTicketUpdate: () => void;
}

export const TicketDetailDialog: React.FC<TicketDetailDialogProps> = ({
  ticket,
  open,
  onClose,
  onTicketUpdate
}) => {
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && ticket) {
      loadMessages();
    }
  }, [open, ticket?.id]);

  const loadMessages = async () => {
    if (!ticket?.id) return;
    
    setIsLoading(true);
    try {
      const ticketMessages = await supportService.getTicketMessages(ticket.id);
      setMessages(ticketMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket?.id) return;

    setIsSubmitting(true);
    try {
      const messageData: CreateMessageRequest = {
        ticket_id: ticket.id,
        message: newMessage.trim(),
        is_internal: false
      };
      
      const message = await supportService.createMessage(messageData);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      onTicketUpdate();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return TICKET_STATUS_COLORS[status as keyof typeof TICKET_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    return TICKET_PRIORITY_COLORS[priority as keyof typeof TICKET_PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{ticket.title}</span>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Ticket Description */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>

            {/* Messages */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages ({messages.length})
              </h3>
              
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Card key={message.id} className={message.is_internal ? 'bg-yellow-50' : ''}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {message.user?.user_metadata?.full_name || message.user?.email || 'User'}
                              </span>
                              {message.is_internal && (
                                <Badge variant="outline" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to send
                  </span>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSubmitting}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Ticket Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(ticket.updated_at)}</span>
                  </div>

                  {ticket.resolved_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Resolved:</span>
                      <span>{formatDate(ticket.resolved_at)}</span>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {ticket.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {ticket.assignee && (
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                          {ticket.assignee.user_metadata?.full_name || ticket.assignee.email}
                        </span>
                      </div>
                    </div>
                  )}

                  {ticket.tags && ticket.tags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tags:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {ticket.resolution && (
                    <div>
                      <span className="text-muted-foreground">Resolution:</span>
                      <p className="mt-1 text-sm bg-muted p-2 rounded">
                        {ticket.resolution}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};