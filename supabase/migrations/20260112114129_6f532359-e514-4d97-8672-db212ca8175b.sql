-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('scout', 'admin');

-- Create enum for player positions
CREATE TYPE public.player_position AS ENUM (
  'goalkeeper', 
  'centre_back', 
  'full_back', 
  'defensive_midfielder', 
  'central_midfielder', 
  'attacking_midfielder', 
  'winger', 
  'striker'
);

-- Create enum for competition levels
CREATE TYPE public.competition_level AS ENUM (
  'amateur', 
  'semi_pro', 
  'professional', 
  'youth_academy', 
  'international'
);

-- Create profiles table for scouts
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'scout',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  current_club TEXT,
  position player_position NOT NULL,
  secondary_position player_position,
  preferred_foot TEXT CHECK (preferred_foot IN ('left', 'right', 'both')),
  height_cm INTEGER,
  weight_kg INTEGER,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scouting_reports table
CREATE TABLE public.scouting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_date DATE NOT NULL,
  match_details TEXT,
  opposition TEXT,
  competition_level competition_level NOT NULL,
  minutes_observed INTEGER,
  
  -- Technical attributes (1-20 scale)
  technical_first_touch INTEGER CHECK (technical_first_touch BETWEEN 1 AND 20),
  technical_passing INTEGER CHECK (technical_passing BETWEEN 1 AND 20),
  technical_crossing INTEGER CHECK (technical_crossing BETWEEN 1 AND 20),
  technical_dribbling INTEGER CHECK (technical_dribbling BETWEEN 1 AND 20),
  technical_shooting INTEGER CHECK (technical_shooting BETWEEN 1 AND 20),
  technical_heading INTEGER CHECK (technical_heading BETWEEN 1 AND 20),
  
  -- Tactical attributes (1-20 scale)
  tactical_positioning INTEGER CHECK (tactical_positioning BETWEEN 1 AND 20),
  tactical_decision_making INTEGER CHECK (tactical_decision_making BETWEEN 1 AND 20),
  tactical_awareness INTEGER CHECK (tactical_awareness BETWEEN 1 AND 20),
  tactical_off_ball_movement INTEGER CHECK (tactical_off_ball_movement BETWEEN 1 AND 20),
  tactical_defensive_contribution INTEGER CHECK (tactical_defensive_contribution BETWEEN 1 AND 20),
  
  -- Physical attributes (1-20 scale)
  physical_pace INTEGER CHECK (physical_pace BETWEEN 1 AND 20),
  physical_stamina INTEGER CHECK (physical_stamina BETWEEN 1 AND 20),
  physical_strength INTEGER CHECK (physical_strength BETWEEN 1 AND 20),
  physical_agility INTEGER CHECK (physical_agility BETWEEN 1 AND 20),
  physical_balance INTEGER CHECK (physical_balance BETWEEN 1 AND 20),
  
  -- Mental attributes (1-20 scale)
  mental_composure INTEGER CHECK (mental_composure BETWEEN 1 AND 20),
  mental_concentration INTEGER CHECK (mental_concentration BETWEEN 1 AND 20),
  mental_leadership INTEGER CHECK (mental_leadership BETWEEN 1 AND 20),
  mental_work_rate INTEGER CHECK (mental_work_rate BETWEEN 1 AND 20),
  mental_aggression INTEGER CHECK (mental_aggression BETWEEN 1 AND 20),
  
  -- Overall rating (calculated, 0-100)
  overall_rating NUMERIC(5,2),
  
  -- Summary and recommendation
  strengths TEXT,
  weaknesses TEXT,
  potential_rating INTEGER CHECK (potential_rating BETWEEN 1 AND 100),
  recommendation TEXT,
  
  -- Draft/autosave support
  is_draft BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Players policies
CREATE POLICY "Scouts can view their own players"
  ON public.players FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can create players"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update their own players"
  ON public.players FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete their own players"
  ON public.players FOR DELETE
  USING (auth.uid() = scout_id);

CREATE POLICY "Admins can view all players"
  ON public.players FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Scouting reports policies
CREATE POLICY "Scouts can view their own reports"
  ON public.scouting_reports FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can create reports"
  ON public.scouting_reports FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update their own reports"
  ON public.scouting_reports FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete their own reports"
  ON public.scouting_reports FOR DELETE
  USING (auth.uid() = scout_id);

CREATE POLICY "Admins can view all reports"
  ON public.scouting_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'scout');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.scouting_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();