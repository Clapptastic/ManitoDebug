
export interface SystemDocumentation {
  id: string;
  title: string;
  category: string;
  content: string;
  version?: string;
  created_at?: string;
  updated_at?: string;
  last_updated?: string;
}

export interface DocumentationResponse {
  data: SystemDocumentation | null;
  error: Error | null;
}

export interface DocumentationListResponse {
  data: SystemDocumentation[] | null;
  error: Error | null;
}
