-- Create the team-logos storage bucket for branding logos
INSERT INTO storage.buckets (id, name, public) VALUES ('team-logos', 'team-logos', true);

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own branding logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own branding logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to logos (needed for PDF export)
CREATE POLICY "Branding logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own branding logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-logos' AND auth.uid()::text = (storage.foldername(name))[1]);