import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditableTitleProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  maxLength?: number;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  value,
  onSave,
  className = '',
  maxLength = 100
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      toast({
        title: 'Invalid Name',
        description: 'Analysis name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(trimmedValue);
      setIsEditing(false);
      toast({
        title: 'Name Updated',
        description: 'Analysis name has been successfully updated'
      });
    } catch (error) {
      console.error('Error saving title:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update analysis name. Please try again.',
        variant: 'destructive'
      });
      setEditValue(value); // Reset to original value
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="flex-1"
          disabled={isSaving}
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={isSaving || !editValue.trim()}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      <span className="flex-1 font-semibold truncate">
        {value}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        title="Edit name"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
};