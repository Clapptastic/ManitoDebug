
import { AffiliateAlert } from '@/types/admin';

export interface AffiliateAlertsProps {
  alerts: AffiliateAlert[];
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}
