-- Create table for code embeddings
CREATE TABLE IF NOT EXISTS public.code_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  language TEXT,
  token_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.code_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own code embeddings" 
ON public.code_embeddings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Super admin can view all embeddings
CREATE POLICY "Super admin can manage all code embeddings" 
ON public.code_embeddings 
FOR ALL 
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR 
  (auth.role() = 'service_role'::text)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_code_embeddings_user_id ON public.code_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_file_path ON public.code_embeddings(file_path);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_language ON public.code_embeddings(language);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_created_at ON public.code_embeddings(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_code_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_code_embeddings_updated_at
BEFORE UPDATE ON public.code_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_code_embeddings_updated_at();