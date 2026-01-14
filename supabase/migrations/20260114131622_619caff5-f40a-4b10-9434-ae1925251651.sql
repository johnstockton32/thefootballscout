-- Create table for storing custom attribute weights per user
CREATE TABLE public.custom_attribute_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position VARCHAR(50) NOT NULL,
  technical_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25 CHECK (technical_weight >= 0 AND technical_weight <= 1),
  tactical_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25 CHECK (tactical_weight >= 0 AND tactical_weight <= 1),
  physical_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25 CHECK (physical_weight >= 0 AND physical_weight <= 1),
  mental_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25 CHECK (mental_weight >= 0 AND mental_weight <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Create table for storing white-label branding settings
CREATE TABLE public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  show_default_branding BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_attribute_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_attribute_weights
CREATE POLICY "Users can view their own attribute weights"
ON public.custom_attribute_weights
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attribute weights"
ON public.custom_attribute_weights
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attribute weights"
ON public.custom_attribute_weights
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attribute weights"
ON public.custom_attribute_weights
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for branding_settings
CREATE POLICY "Users can view their own branding settings"
ON public.branding_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own branding settings"
ON public.branding_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own branding settings"
ON public.branding_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own branding settings"
ON public.branding_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_custom_attribute_weights_updated_at
BEFORE UPDATE ON public.custom_attribute_weights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_settings_updated_at
BEFORE UPDATE ON public.branding_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();