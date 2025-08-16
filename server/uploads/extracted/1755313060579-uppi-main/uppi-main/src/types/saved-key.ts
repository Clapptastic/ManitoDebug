
import { ApiKeyType } from "./api-keys";

export interface SavedKey {
  id: string;
  key_type: ApiKeyType;
  created_at: string;
  user_id?: string;
  email?: string;
  status: {
    status: string;
    lastChecked: string;
    errorMessage?: string | null;
  };
}

