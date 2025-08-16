import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface AIDisclaimerProps {
  variant?: 'default' | 'warning' | 'error';
  confidence?: number;
  className?: string;
  showConfidence?: boolean;
  customMessage?: string;
}

export const AIDisclaimer: React.FC<AIDisclaimerProps> = ({
  variant = 'default',
  confidence,
  className,
  showConfidence = true,
  customMessage
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'error':
        return 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive';
      case 'warning':
        return 'border-orange-500/50 text-orange-700 dark:border-orange-500 dark:text-orange-400 [&>svg]:text-orange-500';
      default:
        return 'border-blue-500/50 text-blue-700 dark:border-blue-500 dark:text-blue-400 [&>svg]:text-blue-500';
    }
  };

  const defaultMessage = customMessage || 
    "AI-Generated Content: This information was generated using artificial intelligence and may contain inaccuracies. Our confidence score is an estimate only. Please verify all information independently before making business decisions.";

  return (
    <Alert className={cn(getVariantClass(), "mb-4", className)}>
      {getIcon()}
      <AlertDescription className="text-sm">
        <strong>⚠️ {defaultMessage}</strong>
        {showConfidence && confidence !== undefined && (
          <div className="mt-2 text-xs opacity-75">
            Confidence Score: {confidence}% (estimate only)
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const useAIDisclaimer = () => {
  const getDisclaimerForContent = (contentType: string, confidence?: number) => {
    const baseMessage = "This information was generated using AI and may not be accurate.";
    
    switch (contentType) {
      case 'competitor_analysis':
        return `${baseMessage} Competitor data should be verified through official sources and market research.`;
      case 'market_research':
        return `${baseMessage} Market insights should be validated with current industry reports and data.`;
      case 'pricing_data':
        return `${baseMessage} Pricing information may be outdated and should be confirmed with vendors.`;
      case 'financial_data':
        return `${baseMessage} Financial projections are estimates only and should not be used for investment decisions.`;
      default:
        return baseMessage;
    }
  };

  const shouldShowDisclaimer = (confidence?: number, contentType?: string) => {
    // Always show disclaimer for AI content
    if (contentType?.includes('ai') || contentType?.includes('generated')) {
      return true;
    }
    
    // Show disclaimer if confidence is below 80%
    if (confidence !== undefined && confidence < 80) {
      return true;
    }
    
    return false;
  };

  return {
    getDisclaimerForContent,
    shouldShowDisclaimer
  };
};