import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIValidationBadgeProps {
  confidence: number;
  riskLevel?: 'low' | 'medium' | 'high';
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AIValidationBadge: React.FC<AIValidationBadgeProps> = ({
  confidence,
  riskLevel,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const getVariant = () => {
    if (riskLevel === 'high' || confidence < 40) return 'destructive';
    if (riskLevel === 'medium' || confidence < 70) return 'secondary';
    return 'default';
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (riskLevel === 'high' || confidence < 40) {
      return <XCircle className="h-3 w-3" />;
    }
    if (riskLevel === 'medium' || confidence < 70) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <CheckCircle className="h-3 w-3" />;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={cn(
        "flex items-center gap-1",
        sizeClasses[size],
        className
      )}
    >
      {getIcon()}
      <span>AI: {confidence}%</span>
      {riskLevel && (
        <span className="text-xs opacity-75">
          ({riskLevel})
        </span>
      )}
    </Badge>
  );
};

export const AIValidationIndicator: React.FC<{
  validation?: {
    confidence_score: number;
    risk_level: 'low' | 'medium' | 'high';
    validation_flags: string[];
  };
  className?: string;
}> = ({ validation, className }) => {
  if (!validation) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        <Shield className="h-3 w-3 mr-1" />
        Unvalidated
      </Badge>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AIValidationBadge
        confidence={validation.confidence_score}
        riskLevel={validation.risk_level}
        size="sm"
      />
      {validation.validation_flags.length > 0 && (
        <Badge variant="outline" className="text-xs">
          {validation.validation_flags.length} flags
        </Badge>
      )}
    </div>
  );
};