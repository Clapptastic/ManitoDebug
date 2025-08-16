
import React, { useState, createContext, useContext, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolve, setResolve] = useState<(value: boolean) => void>(() => () => {});

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((res) => {
      setOptions(options);
      setResolve(() => res);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolve(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title || 'Confirm Action'}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description || 'Are you sure you want to continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {options.confirmText || 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }

  return context;
};
