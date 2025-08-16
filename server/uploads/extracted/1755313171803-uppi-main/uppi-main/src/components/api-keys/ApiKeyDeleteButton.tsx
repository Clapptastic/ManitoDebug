import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { toast } from '@/hooks/use-toast';

interface ApiKeyDeleteButtonProps {
  id: string;
  provider: string;
  disabled?: boolean;
  onDeleted?: () => void;
}

export const ApiKeyDeleteButton: React.FC<ApiKeyDeleteButtonProps> = ({
  id,
  provider,
  disabled = false,
  onDeleted
}) => {
  const { deleteApiKey } = useUnifiedApiKeys();

  const handleDelete = async () => {
    try {
      await deleteApiKey(id);
      onDeleted?.();
      toast({
        title: 'Success',
        description: `${provider} API key deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete API key.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={disabled}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};