-- Create a table to store super admin emails (platform-level admins with full control)
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view this table
CREATE POLICY "Super admins table is only readable by admins"
ON public.super_admins
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Insert the super admin email
INSERT INTO public.super_admins (email) VALUES ('stockton9@outlook.com');

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins sa
    JOIN public.profiles p ON LOWER(p.email) = LOWER(sa.email)
    WHERE p.id = _user_id
  )
$$;