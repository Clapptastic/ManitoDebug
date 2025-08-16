
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

interface TypeDebuggingButtonProps {
  data: any;
  label: string;
  context: string;
  asPostgrest?: boolean;
}

const TypeDebuggingButton: React.FC<TypeDebuggingButtonProps> = ({
  data,
  label,
  context
}) => {
  const handleDebug = () => {
    console.log(`[${context}] ${label}:`, data);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDebug}
      className="text-xs"
    >
      <Bug className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
};

export default TypeDebuggingButton;
