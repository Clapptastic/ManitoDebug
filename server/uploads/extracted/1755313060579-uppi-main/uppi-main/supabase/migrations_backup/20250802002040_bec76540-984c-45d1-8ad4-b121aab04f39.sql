-- Fix RLS policies for competitor_group_entries
DROP POLICY IF EXISTS "Users can manage their own competitor group entries" ON public.competitor_group_entries;
DROP POLICY IF EXISTS "Users can view their own competitor group entries" ON public.competitor_group_entries;

CREATE POLICY "Users can manage their own competitor group entries"
ON public.competitor_group_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.competitor_groups cg 
    WHERE cg.id = competitor_group_entries.group_id 
    AND cg.user_id = auth.uid()
  )
);

-- Fix RLS policies for competitor_groups  
DROP POLICY IF EXISTS "Users can manage their own competitor groups" ON public.competitor_groups;
DROP POLICY IF EXISTS "Users can view their own competitor groups" ON public.competitor_groups;

CREATE POLICY "Users can manage their own competitor groups"
ON public.competitor_groups
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for code_embeddings
DROP POLICY IF EXISTS "Users can manage their own code embeddings" ON public.code_embeddings;
DROP POLICY IF EXISTS "Users can view their own code embeddings" ON public.code_embeddings;

CREATE POLICY "Users can manage their own code embeddings"
ON public.code_embeddings
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for embeddings_status
DROP POLICY IF EXISTS "Users can manage their own embeddings status" ON public.embeddings_status;
DROP POLICY IF EXISTS "Users can view their own embeddings status" ON public.embeddings_status;

CREATE POLICY "Users can manage their own embeddings status"
ON public.embeddings_status
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for documents
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;

CREATE POLICY "Users can manage their own documents"
ON public.documents
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_competitor_group_entries_group_id ON public.competitor_group_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_user_id ON public.code_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_status_user_id ON public.embeddings_status(user_id);