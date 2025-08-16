/**
 * Invoice List Component
 * Display billing invoice history with download options
 */

import React from 'react';
import { Download, Calendar, Receipt, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BillingInvoice } from '@/types/billing';

interface InvoiceListProps {
  invoices: BillingInvoice[];
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500">Paid</Badge>;
      case 'open':
        return <Badge className="bg-yellow-500">Open</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'uncollectible':
        return <Badge variant="destructive">Uncollectible</Badge>;
      case 'void':
        return <Badge variant="secondary">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = (invoice: BillingInvoice) => {
    if (invoice.download_url) {
      window.open(invoice.download_url, '_blank');
    }
  };

  if (invoices.length === 0) {
    return (
      <Alert>
        <Receipt className="h-4 w-4" />
        <AlertDescription>
          No invoices found. Invoices will appear here once you have billing activity.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      Invoice #{invoice.invoice_number}
                    </span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(invoice.created_at)}</span>
                    </div>
                    
                    {invoice.due_date && invoice.status !== 'paid' && (
                      <div className="text-orange-600">
                        Due {formatDate(invoice.due_date)}
                      </div>
                    )}
                    
                    {invoice.paid_at && (
                      <div className="text-emerald-600">
                        Paid {formatDate(invoice.paid_at)}
                      </div>
                    )}
                  </div>
                  
                  {invoice.subscription?.plan && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {invoice.subscription.plan.name} subscription
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-medium text-lg">
                    {formatAmount(invoice.total_amount)}
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="text-sm text-muted-foreground">
                      +{formatAmount(invoice.tax_amount)} tax
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {invoice.download_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {invoice.stripe_invoice_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Open Stripe invoice in new tab
                        const stripeUrl = `https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`;
                        window.open(stripeUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};