-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Update code_embeddings table to use vector type instead of jsonb
ALTER TABLE public.code_embeddings 
ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Copy existing jsonb embeddings to vector format (if any exist)
UPDATE public.code_embeddings 
SET embedding_vector = embedding::vector(1536)
WHERE embedding IS NOT NULL AND embedding_vector IS NULL;

-- Update the match_code_embeddings function to use proper vector operations
CREATE OR REPLACE FUNCTION public.match_code_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_param UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  file_path TEXT,
  content TEXT,
  language TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or get current authenticated user
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return empty if no user
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Perform vector similarity search using cosine distance
  RETURN QUERY
  SELECT 
    ce.id,
    ce.file_path,
    ce.content,
    ce.language,
    1 - (ce.embedding_vector <=> query_embedding) as similarity
  FROM public.code_embeddings ce
  WHERE ce.user_id = target_user_id
    AND ce.embedding_vector IS NOT NULL
    AND 1 - (ce.embedding_vector <=> query_embedding) > similarity_threshold
  ORDER BY ce.embedding_vector <=> query_embedding
  LIMIT match_count;
END;
$$;