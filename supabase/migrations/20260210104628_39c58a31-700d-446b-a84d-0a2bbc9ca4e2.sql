
-- Function to seed sample data for new users
CREATE OR REPLACE FUNCTION public.seed_sample_data_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _player_id UUID;
BEGIN
  -- Only run for brand new profiles (on INSERT)
  -- Create a sample player
  INSERT INTO public.players (
    id, scout_id, full_name, position, date_of_birth, nationality, current_club, notes, preferred_foot
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    'Marcus Johnson',
    'striker',
    '2004-03-15',
    'English',
    'Academy FC',
    'Sample player created to help you explore the app. Feel free to edit or delete!',
    'Right'
  ) RETURNING id INTO _player_id;

  -- Create a sample scouting report for that player
  INSERT INTO public.scouting_reports (
    scout_id, player_id, match_date, competition_level, opposition, minutes_observed,
    technical_passing, technical_dribbling, technical_shooting, technical_first_touch, technical_crossing, technical_heading,
    tactical_positioning, tactical_awareness, tactical_decision_making, tactical_off_ball_movement, tactical_defensive_contribution,
    physical_pace, physical_strength, physical_stamina, physical_agility, physical_balance,
    mental_composure, mental_concentration, mental_leadership, mental_work_rate, mental_aggression,
    overall_rating, potential_rating, recommendation, strengths, weaknesses, match_details, is_draft
  ) VALUES (
    NEW.id, _player_id, CURRENT_DATE - INTERVAL '3 days', 'youth_academy', 'City United U18', 90,
    72, 78, 80, 74, 65, 70,
    68, 72, 70, 76, 55,
    82, 68, 74, 78, 72,
    70, 72, 60, 80, 68,
    73, 82, 'Monitor', 
    'Excellent pace and movement off the ball. Natural goal-scoring instinct with good composure in front of goal.',
    'Needs to improve defensive contribution and heading ability. Can lose concentration in deeper positions.',
    'Observed in youth academy match. Showed great energy and willingness to press. This is a sample report to help you explore the app.',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-seed sample data on new profile creation
CREATE TRIGGER seed_sample_data_on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_sample_data_for_new_user();
