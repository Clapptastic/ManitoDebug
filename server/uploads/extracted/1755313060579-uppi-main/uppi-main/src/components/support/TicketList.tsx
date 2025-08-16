/**
 * Ticket List Component
 * Displays and manages support tickets
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Search, 
  Filter,
  Plus,
  Eye
} from 'lucide-react';
import type { 
  SupportTicket, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  TicketFilters 
} from '@/types/support';
import { 
  TICKET_STATUS_COLORS, 
  TICKET_PRIORITY_COLORS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES
} from '@/types/support';
import { TicketDetailDialog } from './TicketDetailDialog';
import { CreateTicketDialog } from './CreateTicketDialog';

interface TicketListProps {
  tickets: SupportTicket[];
  onTicketUpdate: () => void;
  showCreateButton?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  onTicketUpdate,
  showCreateButton = true 
}) => {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredTickets = tickets.filter(ticket => {
    if (filters.status?.length && !filters.status.includes(ticket.status)) return false;
    if (filters.priority?.length && !filters.priority.includes(ticket.priority)) return false;
    if (filters.category?.length && !filters.category.includes(ticket.category)) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return ticket.title.toLowerCase().includes(search) || 
             ticket.description.toLowerCase().includes(search);
    }
    return true;
  });

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getStatusColor = (status: TicketStatus) => {
    return TICKET_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: TicketPriority) => {
    return TICKET_PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground">
            Manage your support requests and track their progress
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={() => setShowCreateTicket(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid gap-4 sm:grid-cols-3">
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) => 
                  handleFilterChange('status', value ? [value as TicketStatus] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {TICKET_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priority?.[0] || ''}
                onValueChange={(value) => 
                  handleFilterChange('priority', value ? [value as TicketPriority] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {TICKET_PRIORITIES.map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {priority.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.category?.[0] || ''}
                onValueChange={(value) => 
                  handleFilterChange('category', value ? [value as TicketCategory] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TICKET_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="sm:col-span-3">
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {tickets.length === 0 
                  ? "You haven't created any support tickets yet." 
                  : "No tickets match your current filters."
                }
              </p>
              {showCreateButton && tickets.length === 0 && (
                <Button onClick={() => setShowCreateTicket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{ticket.message_count || 0} messages</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{getTimeAgo(ticket.created_at)}</span>
                      </div>
                      {ticket.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>
                            {ticket.assignee.user_metadata?.full_name || ticket.assignee.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdate={onTicketUpdate}
        />
      )}

      {showCreateTicket && (
        <CreateTicketDialog
          open={showCreateTicket}
          onClose={() => setShowCreateTicket(false)}
          onTicketCreated={(ticket) => {
            onTicketUpdate();
            setShowCreateTicket(false);
          }}
        />
      )}
    </div>
  );
};