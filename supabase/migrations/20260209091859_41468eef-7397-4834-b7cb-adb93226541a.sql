
-- Create player development notes table for tracking milestones and progress
CREATE TABLE public.player_development_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  scout_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'observation',
  title TEXT NOT NULL,
  content TEXT,
  rating_snapshot NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_development_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Scouts can view their own development notes"
ON public.player_development_notes FOR SELECT
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can create development notes"
ON public.player_development_notes FOR INSERT
WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update their own development notes"
ON public.player_development_notes FOR UPDATE
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete their own development notes"
ON public.player_development_notes FOR DELETE
USING (auth.uid() = scout_id);

CREATE POLICY "Admins can view all development notes"
ON public.player_development_notes FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any development note"
ON public.player_development_notes FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_player_development_notes_updated_at
BEFORE UPDATE ON public.player_development_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_player_development_notes_player_id ON public.player_development_notes(player_id);
CREATE INDEX idx_player_development_notes_scout_id ON public.player_development_notes(scout_id);
