-- Create platform_roles table for user roles
CREATE TABLE public.platform_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for platform_roles
CREATE POLICY "Users can view their own roles" 
ON public.platform_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles" 
ON public.platform_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage all roles" 
ON public.platform_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);