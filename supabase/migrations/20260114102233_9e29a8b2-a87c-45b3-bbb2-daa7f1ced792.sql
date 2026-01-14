-- Add agency tier to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'agency';

-- Create watchlists table
CREATE TABLE public.watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watchlist_players junction table
CREATE TABLE public.watchlist_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  priority INTEGER DEFAULT 0,
  UNIQUE(watchlist_id, player_id)
);

-- Create video_clips table for report attachments
CREATE TABLE public.video_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.scouting_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  timestamp_start INTEGER,
  timestamp_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_templates table
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_insights table for storing AI analysis
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.scouting_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_activity table for collaboration feed
CREATE TABLE public.team_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

-- Watchlists policies
CREATE POLICY "Users can view their own watchlists" ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlists" ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" ON public.watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist players policies
CREATE POLICY "Users can view watchlist players" ON public.watchlist_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add players to watchlists" ON public.watchlist_players
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update watchlist players" ON public.watchlist_players
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can remove players from watchlists" ON public.watchlist_players
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

-- Video clips policies
CREATE POLICY "Users can view video clips for their reports" ON public.video_clips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.scouting_reports WHERE id = report_id AND scout_id = auth.uid())
  );

CREATE POLICY "Users can add video clips" ON public.video_clips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their video clips" ON public.video_clips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their video clips" ON public.video_clips
  FOR DELETE USING (auth.uid() = user_id);

-- Report templates policies
CREATE POLICY "Users can view their own templates" ON public.report_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates" ON public.report_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their templates" ON public.report_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their templates" ON public.report_templates
  FOR DELETE USING (auth.uid() = user_id);

-- AI insights policies
CREATE POLICY "Users can view their AI insights" ON public.ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI insights" ON public.ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their AI insights" ON public.ai_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Team activity policies (team members can view)
CREATE POLICY "Team members can view activity" ON public.team_activity
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id = team_activity.team_id)
  );

CREATE POLICY "Users can create activity" ON public.team_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for video clips
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-clips', 'video-clips', false)
ON CONFLICT (id) DO NOTHING;

-- Video clips storage policies
CREATE POLICY "Users can view their video clips" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload video clips" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'video-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their video clips" ON storage.objects
  FOR UPDATE USING (bucket_id = 'video-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their video clips" ON storage.objects
  FOR DELETE USING (bucket_id = 'video-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updated_at
CREATE TRIGGER update_watchlists_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for team activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activity;