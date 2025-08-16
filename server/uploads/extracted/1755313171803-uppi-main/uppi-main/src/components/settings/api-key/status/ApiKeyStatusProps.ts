
import { ApiKeyType, ApiKeyStatus } from '@/types/api-keys/unified';

export interface ApiKeyStatusProps {
  keyType: ApiKeyType;
  status: ApiKeyStatus;
  lastChecked?: string;
  errorMessage?: string;
  onRefresh?: () => void;
}
