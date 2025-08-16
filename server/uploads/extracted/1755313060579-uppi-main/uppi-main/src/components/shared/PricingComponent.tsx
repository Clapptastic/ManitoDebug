
import React from 'react';

// Type for the pricing data
export interface PricingComponentProps {
  pricing: string | {
    model?: string;
    tiers?: string[];
    strategy?: string;
    free_trial?: boolean;
    discounts?: string[];
    description?: string;
    [key: string]: any;
  };
}

/**
 * A component that renders pricing information in a consistent way
 * Handles both string and object representations of pricing data
 */
const PricingComponent: React.FC<PricingComponentProps> = ({ pricing }) => {
  // If pricing is a string, just render it
  if (typeof pricing === 'string') {
    return <span className="text-gray-800">{pricing}</span>;
  }

  // If pricing is an object, render its details
  const { model, tiers, strategy, free_trial, discounts, description } = pricing;

  return (
    <div className="text-gray-800">
      {model && <div><span className="font-medium">Model:</span> {model}</div>}
      
      {tiers && tiers.length > 0 && (
        <div>
          <span className="font-medium">Tiers:</span>{' '}
          {tiers.join(', ')}
        </div>
      )}
      
      {strategy && <div><span className="font-medium">Strategy:</span> {strategy}</div>}
      
      {free_trial !== undefined && (
        <div><span className="font-medium">Free Trial:</span> {free_trial ? 'Yes' : 'No'}</div>
      )}
      
      {discounts && discounts.length > 0 && (
        <div>
          <span className="font-medium">Discounts:</span>{' '}
          {discounts.join(', ')}
        </div>
      )}
      
      {description && <div className="mt-1">{description}</div>}
    </div>
  );
};

export default PricingComponent;
