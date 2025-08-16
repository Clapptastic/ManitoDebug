
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorWithCopyButtonProps {
  error: Error | string;
  className?: string;
}

const ErrorWithCopyButton: React.FC<ErrorWithCopyButtonProps> = ({
  error,
  className = ''
}) => {
  const { toast } = useToast();
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  const copyToClipboard = async () => {
    try {
      const textToCopy = errorStack || errorMessage;
      await navigator.clipboard.writeText(textToCopy);
      
      toast({
        title: 'Error copied',
        description: 'Error details have been copied to clipboard.',
        duration: 3000
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy error details.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className={`bg-destructive/10 p-3 rounded-md ${className}`}>
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-medium text-destructive">Error</h4>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-6 w-6"
        >
          <Clipboard className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="font-mono text-sm text-destructive/90">{errorMessage}</div>
    </div>
  );
};

export default ErrorWithCopyButton;
