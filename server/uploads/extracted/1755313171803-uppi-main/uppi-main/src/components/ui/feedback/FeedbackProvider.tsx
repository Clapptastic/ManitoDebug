/**
 * Unified Feedback Provider
 * Provides consistent feedback messaging across the application
 */

import React, { createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';
import { FEEDBACK_MESSAGES } from './FeedbackConstants';

interface FeedbackContextValue {
  showSuccess: (type: keyof typeof FEEDBACK_MESSAGES.SUCCESS, ...args: any[]) => void;
  showError: (type: keyof typeof FEEDBACK_MESSAGES.ERROR, ...args: any[]) => void;
  showWarning: (type: keyof typeof FEEDBACK_MESSAGES.WARNING, ...args: any[]) => void;
  showInfo: (type: keyof typeof FEEDBACK_MESSAGES.INFO, ...args: any[]) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showSuccess = (type: keyof typeof FEEDBACK_MESSAGES.SUCCESS, ...args: any[]) => {
    const message = typeof FEEDBACK_MESSAGES.SUCCESS[type] === 'function' 
      ? (FEEDBACK_MESSAGES.SUCCESS[type] as any)(...args)
      : FEEDBACK_MESSAGES.SUCCESS[type];
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'default'
    });
  };

  const showError = (type: keyof typeof FEEDBACK_MESSAGES.ERROR, ...args: any[]) => {
    const message = typeof FEEDBACK_MESSAGES.ERROR[type] === 'function'
      ? (FEEDBACK_MESSAGES.ERROR[type] as any)(...args)
      : FEEDBACK_MESSAGES.ERROR[type];
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'destructive'
    });
  };

  const showWarning = (type: keyof typeof FEEDBACK_MESSAGES.WARNING, ...args: any[]) => {
    const message = typeof FEEDBACK_MESSAGES.WARNING[type] === 'function'
      ? (FEEDBACK_MESSAGES.WARNING[type] as any)(...args)
      : FEEDBACK_MESSAGES.WARNING[type];
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'default'
    });
  };

  const showInfo = (type: keyof typeof FEEDBACK_MESSAGES.INFO, ...args: any[]) => {
    const message = typeof FEEDBACK_MESSAGES.INFO[type] === 'function'
      ? (FEEDBACK_MESSAGES.INFO[type] as any)(...args)
      : FEEDBACK_MESSAGES.INFO[type];
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'default'
    });
  };

  const value: FeedbackContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};