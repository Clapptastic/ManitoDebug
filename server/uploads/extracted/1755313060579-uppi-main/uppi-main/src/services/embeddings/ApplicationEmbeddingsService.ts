import { supabase } from "@/integrations/supabase/client";

export interface FileProcessingOptions {
  includeTests?: boolean;
  includeNodeModules?: boolean;
  filePatterns?: string[];
  excludePatterns?: string[];
}

export interface EmbeddingResult {
  success: boolean;
  processedFiles: string[];
  totalFiles: number;
  errors?: string[];
}

export interface SearchResult {
  id: string;
  file_path: string;
  content: string;
  language: string;
  similarity: number;
  metadata?: any;
}

export class ApplicationEmbeddingsService {
  private static instance: ApplicationEmbeddingsService;

  public static getInstance(): ApplicationEmbeddingsService {
    if (!ApplicationEmbeddingsService.instance) {
      ApplicationEmbeddingsService.instance = new ApplicationEmbeddingsService();
    }
    return ApplicationEmbeddingsService.instance;
  }

  /**
   * Process the entire application codebase for embeddings
   */
  async processApplicationCodebase(options: FileProcessingOptions = {}): Promise<EmbeddingResult> {
    try {
      const { data, error } = await supabase.functions.invoke('process-application-embeddings', {
        body: {
          operation: 'process_codebase',
          options
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to process application codebase:', error);
      throw new Error(`Codebase processing failed: ${error.message}`);
    }
  }

  /**
   * Process individual files for embeddings
   */
  async processFile(filePath: string, content: string, language: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('process-application-embeddings', {
        body: {
          operation: 'process_file',
          fileData: {
            filePath,
            content,
            language
          }
        }
      });

      if (error) throw error;

      return data.success;
    } catch (error) {
      console.error(`Failed to process file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Batch process multiple files
   */
  async batchProcessFiles(files: Array<{ filePath: string; content: string; language: string }>): Promise<EmbeddingResult> {
    try {
      const { data, error } = await supabase.functions.invoke('process-application-embeddings', {
        body: {
          operation: 'batch_process',
          fileData: files
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to batch process files:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }

  /**
   * Search embeddings using semantic similarity
   */
  async searchCode(
    query: string, 
    options: {
      limit?: number;
      similarityThreshold?: number;
      fileTypes?: string[];
      categories?: string[];
    } = {}
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-embeddings-api', {
        body: {
          operation: 'search',
          query,
          limit: options.limit,
          similarity_threshold: options.similarityThreshold,
          file_types: options.fileTypes,
          categories: options.categories
        }
      });

      if (error) throw error;

      return data.results || [];
    } catch (error) {
      console.error('Failed to search embeddings:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get specific file content and metadata
   */
  async getFileData(filePath: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-embeddings-api', {
        body: {
          operation: 'get_file',
          file_path: filePath
        }
      });

      if (error) throw error;

      return data.file_data;
    } catch (error) {
      console.error(`Failed to get file data for ${filePath}:`, error);
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  /**
   * List all processed files with filters
   */
  async listProcessedFiles(filters: {
    category?: string;
    language?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-embeddings-api', {
        body: {
          operation: 'list_files',
          ...filters
        }
      });

      if (error) throw error;

      return data.files || [];
    } catch (error) {
      console.error('Failed to list processed files:', error);
      throw new Error(`File listing failed: ${error.message}`);
    }
  }

  /**
   * Get available categories and languages
   */
  async getMetadata(): Promise<{ categories: string[]; languages: string[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-embeddings-api', {
        body: {
          operation: 'get_categories'
        }
      });

      if (error) throw error;

      return {
        categories: data.categories || [],
        languages: data.languages || []
      };
    } catch (error) {
      console.error('Failed to get metadata:', error);
      return { categories: [], languages: [] };
    }
  }

  /**
   * Health check for embeddings system
   */
  async healthCheck(): Promise<{ status: string; embeddingsCount: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-embeddings-api', {
        body: {
          operation: 'health_check'
        }
      });

      if (error) throw error;

      return {
        status: data.status,
        embeddingsCount: data.embeddings_count
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', embeddingsCount: 0 };
    }
  }
}