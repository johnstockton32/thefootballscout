-- Update handle_new_user trigger to also extract organization from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'organization'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'scout');
  
  RETURN NEW;
END;
$$;