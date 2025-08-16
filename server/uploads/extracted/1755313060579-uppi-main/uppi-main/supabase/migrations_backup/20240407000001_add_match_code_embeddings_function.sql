
-- Function to find similar code based on embedding similarity
CREATE OR REPLACE FUNCTION public.match_code_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  file_path text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.file_path,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE
    ce.deleted_at IS NULL AND
    ce.user_id = p_user_id AND
    1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
