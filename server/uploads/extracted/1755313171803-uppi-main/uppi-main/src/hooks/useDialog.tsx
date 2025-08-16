
import React, { useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DialogOptions {
  title: string;
  description?: string;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  onConfirm?: (values: Record<string, any>) => Promise<boolean> | boolean;
  onCancel?: () => void;
}

interface UseDialogReturn {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
  DialogComponent: React.FC;
  isOpen: boolean;
  dialogValues: Record<string, any>;
  setDialogValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const useDialog = (): UseDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [dialogValues, setDialogValues] = useState<Record<string, any>>({});

  const openDialog = (opts: DialogOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setDialogValues({});
  };

  const closeDialog = () => {
    setIsOpen(false);
    setOptions(null);
    setDialogValues({});
  };

  const handleConfirm = async () => {
    if (!options?.onConfirm) {
      closeDialog();
      return;
    }

    setIsLoading(true);
    try {
      const result = await options.onConfirm(dialogValues);
      if (result) {
        closeDialog();
      }
    } catch (error) {
      console.error("Dialog confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }
    closeDialog();
  };

  const DialogComponent = () => {
    if (!options) return null;

    return (
      <Dialog open={isOpen} onOpenChange={isOpen => {
        if (!isOpen && !isLoading) closeDialog();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            {options.description && (
              <DialogDescription>{options.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {options.content && (
            <div className="py-2">{options.content}</div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {options.cancelText || 'Cancel'}
            </Button>
            <Button
              variant={options.confirmVariant || 'default'}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                options.confirmText || 'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    openDialog,
    closeDialog,
    DialogComponent,
    isOpen,
    dialogValues,
    setDialogValues,
  };
};
