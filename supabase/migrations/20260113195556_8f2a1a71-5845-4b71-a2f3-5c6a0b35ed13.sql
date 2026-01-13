-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow team owners to upload logos
CREATE POLICY "Team owners can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
  )
);

-- Allow team owners to update logos
CREATE POLICY "Team owners can update logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'team-logos'
  AND EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
  )
);

-- Allow team owners to delete logos
CREATE POLICY "Team owners can delete logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-logos'
  AND EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
  )
);

-- Allow public access to view team logos
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-logos');