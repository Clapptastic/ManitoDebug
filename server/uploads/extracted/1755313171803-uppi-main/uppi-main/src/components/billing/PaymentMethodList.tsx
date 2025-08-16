/**
 * Payment Method List Component
 * Display and manage saved payment methods
 */

import React from 'react';
import { CreditCard, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PaymentMethod } from '@/types/billing';

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

export const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  paymentMethods,
  onUpdate
}) => {
  const formatCardBrand = (brand: string | null) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const getCardIcon = (brand: string | null) => {
    // In a real app, you'd have specific card brand icons
    return <CreditCard className="w-4 h-4" />;
  };

  const formatExpiryDate = (month: number | null, year: number | null) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (paymentMethods.length === 0) {
    return (
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          No payment methods found. Add a payment method through the Stripe Customer Portal to manage your billing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <Card key={method.id} className={`${method.is_default ? 'border-primary bg-primary/5' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
                  {getCardIcon(method.card_brand)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {formatCardBrand(method.card_brand)} •••• {method.card_last4}
                    </span>
                    {method.is_default && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Default</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {formatExpiryDate(method.card_exp_month, method.card_exp_year)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!method.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Handle setting as default
                      // This would typically call BillingService.setDefaultPaymentMethod
                    }}
                  >
                    Set Default
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    // Handle removal
                    // This would typically call BillingService.removePaymentMethod
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="text-sm text-muted-foreground">
        To add or modify payment methods, use the "Manage Subscription" button to access the Stripe Customer Portal.
      </div>
    </div>
  );
};