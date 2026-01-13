-- Create player-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload player photos
CREATE POLICY "Users can upload player photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their player photos
CREATE POLICY "Users can update player photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their player photos
CREATE POLICY "Users can delete player photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to player photos
CREATE POLICY "Player photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'player-photos');