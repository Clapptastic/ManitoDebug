
export interface CodeEmbedding {
  id: string;
  file_path: string;
  content: string;
  language?: string;
  embedding?: any;
  embedding_model?: string;
  token_count?: number;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  user_id: string;
  metadata?: any;
}

export interface FileTypeStats {
  extension: string;
  count: number;
  percentage: number;
}

export interface CodeEmbeddingStats {
  total: number;
  tokenCount: number;
  avgTokensPerFile: number;
  fileTypes: FileTypeStats[];
  lastUpdated: string;
  
  // Additional fields for compatibility with API responses and tests
  totalEmbeddings: number;
  tokensUsed: number;
  status: string;
  lastCheck: string;
  
  // For backward compatibility with test files
  total_count?: number;
  total_tokens?: number;
  avg_processing_time?: number;
  file_types?: FileTypeStats[];
  recent_uploads?: any[];
}

export interface CodeSearchResult {
  id: string;
  file_path: string;
  content: string;
  similarity: number;
}

export interface CodeEmbeddingsHookReturn {
  embeddings: CodeEmbedding[];
  stats: CodeEmbeddingStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshEmbeddings: () => Promise<void>;
  uploadCodeFile: (file: File, progressCallback?: (progress: number) => void) => Promise<{ success: boolean; error?: string }>;
  removeEmbedding: (id: string) => Promise<boolean>;
  isRefreshing: boolean;
  status: any;
  requestEmbeddingGeneration: () => Promise<void>;
}
