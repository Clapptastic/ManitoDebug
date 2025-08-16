-- Fix missing website_verified column in competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS website_verified boolean DEFAULT false;

-- Fix missing employee_count_verified column if needed  
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS employee_count_verified boolean DEFAULT false;