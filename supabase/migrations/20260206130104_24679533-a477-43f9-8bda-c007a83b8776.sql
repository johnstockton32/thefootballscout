-- Add baseline authentication policy for profiles table
-- This ensures anonymous/unauthenticated users cannot query profiles at all
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);