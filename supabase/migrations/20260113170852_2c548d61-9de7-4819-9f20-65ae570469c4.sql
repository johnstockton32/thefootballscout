-- Add length constraints for text fields to enforce server-side validation
-- Players table
ALTER TABLE public.players 
  ADD CONSTRAINT check_full_name_length CHECK (length(full_name) <= 100),
  ADD CONSTRAINT check_nationality_length CHECK (nationality IS NULL OR length(nationality) <= 50),
  ADD CONSTRAINT check_current_club_length CHECK (current_club IS NULL OR length(current_club) <= 100),
  ADD CONSTRAINT check_preferred_foot_length CHECK (preferred_foot IS NULL OR length(preferred_foot) <= 20),
  ADD CONSTRAINT check_notes_length CHECK (notes IS NULL OR length(notes) <= 5000);

-- Profiles table
ALTER TABLE public.profiles 
  ADD CONSTRAINT check_profile_full_name_length CHECK (full_name IS NULL OR length(full_name) <= 100),
  ADD CONSTRAINT check_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT check_organization_length CHECK (organization IS NULL OR length(organization) <= 100);

-- Scouting reports table
ALTER TABLE public.scouting_reports 
  ADD CONSTRAINT check_opposition_length CHECK (opposition IS NULL OR length(opposition) <= 100),
  ADD CONSTRAINT check_match_details_length CHECK (match_details IS NULL OR length(match_details) <= 2000),
  ADD CONSTRAINT check_strengths_length CHECK (strengths IS NULL OR length(strengths) <= 2000),
  ADD CONSTRAINT check_weaknesses_length CHECK (weaknesses IS NULL OR length(weaknesses) <= 2000),
  ADD CONSTRAINT check_recommendation_length CHECK (recommendation IS NULL OR length(recommendation) <= 2000);