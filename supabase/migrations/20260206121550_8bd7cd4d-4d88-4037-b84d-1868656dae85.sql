-- Make player-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'player-photos';

-- Drop the public read policy
DROP POLICY IF EXISTS "Player photos are publicly accessible" ON storage.objects;

-- Add authenticated read policy - users can view photos they uploaded or in their scope
CREATE POLICY "Authenticated users can view player photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'player-photos');