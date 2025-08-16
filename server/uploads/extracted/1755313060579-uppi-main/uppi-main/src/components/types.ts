
import { ApiProviderStatusInfo, ApiKeyStatus } from '@/types/api-keys';

export interface ApiToggleItemProps {
  title: string;
  description?: string;
  keyType: string;
  status: ApiProviderStatusInfo;
  onToggle?: (checked: boolean) => void;
  checked?: boolean;
}

export type { ApiProviderStatusInfo, ApiKeyStatus };
