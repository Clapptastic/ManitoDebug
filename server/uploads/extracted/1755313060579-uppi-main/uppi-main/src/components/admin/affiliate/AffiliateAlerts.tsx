
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { AffiliateAlert } from '@/types/admin';

interface AffiliateAlertsProps {
  alerts: AffiliateAlert[];
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const AffiliateAlerts: React.FC<AffiliateAlertsProps> = ({ alerts, onResolve, onDismiss }) => {
  const getAlertIcon = (type: AffiliateAlert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: AffiliateAlert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No alerts at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts ({alerts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
            {getAlertIcon(alert.type)}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default AffiliateAlerts;
