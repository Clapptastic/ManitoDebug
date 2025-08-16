import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTicketDialog } from '@/components/support/CreateTicketDialog';
import type { SupportTicket } from '@/types/support';

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTicketCreated = (ticket: SupportTicket) => {
    navigate(`/support/ticket/${ticket.id}`);
  };

  const handleClose = () => {
    navigate('/support');
  };

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

      <CreateTicketDialog
        open={true}
        onClose={handleClose}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
};

export default CreateTicketPage;