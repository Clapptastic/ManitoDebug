
export interface SystemDocumentation {
  id: string;
  title: string;
  category: string;
  content: string;
  version: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    criticality?: 'low' | 'medium' | 'high';
    enforced?: boolean;
    requires_approval?: boolean;
    locked?: boolean;
    [key: string]: string | number | boolean | undefined;
  };
}
