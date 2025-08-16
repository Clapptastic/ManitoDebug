import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  assigned_to?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  attachments: any;
  created_at: string;
}

class SupportTicketService {
  async createTicket(ticketData: {
    title: string;
    description: string;
    priority?: string;
    category?: string;
  }): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        category: ticketData.category,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTicketById(id: string): Promise<SupportTicket | null> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async updateTicketStatus(id: string, status: SupportTicket['status']): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async addTicketMessage(ticketId: string, message: string): Promise<SupportTicketMessage> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        message,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        is_internal: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export const supportTicketService = new SupportTicketService();