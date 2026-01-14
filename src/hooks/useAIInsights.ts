import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InsightType = 'summary' | 'development' | 'comparison' | 'transfer';

interface PlayerData {
  full_name: string;
  position: string;
  current_club: string | null;
  nationality: string | null;
  date_of_birth: string | null;
}

interface ReportData {
  match_date: string;
  opposition: string | null;
  competition_level: string;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_first_touch: number | null;
  technical_passing: number | null;
  technical_dribbling: number | null;
  technical_shooting: number | null;
  technical_crossing: number | null;
  technical_heading: number | null;
  tactical_positioning: number | null;
  tactical_decision_making: number | null;
  tactical_awareness: number | null;
  tactical_off_ball_movement: number | null;
  tactical_defensive_contribution: number | null;
  physical_pace: number | null;
  physical_agility: number | null;
  physical_strength: number | null;
  physical_stamina: number | null;
  physical_balance: number | null;
  mental_composure: number | null;
  mental_concentration: number | null;
  mental_work_rate: number | null;
  mental_leadership: number | null;
  mental_aggression: number | null;
  strengths: string | null;
  weaknesses: string | null;
}

export function useAIInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const generateInsight = async (
    player: PlayerData,
    reports: ReportData[],
    insightType: InsightType
  ) => {
    if (reports.length === 0) {
      toast.error('No scouting reports available for analysis');
      return null;
    }

    setIsLoading(true);
    setInsight(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-scouting-insights', {
        body: {
          player: {
            ...player,
            age: calculateAge(player.date_of_birth),
          },
          reports,
          insightType,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setInsight(data.insight);
      return data.insight;
    } catch (error) {
      console.error('AI insight error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate AI insight';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveInsight = async (
    playerId: string,
    reportId: string | null,
    userId: string,
    insightType: InsightType,
    content: string
  ) => {
    try {
      const { error } = await supabase.from('ai_insights').insert({
        player_id: playerId,
        report_id: reportId,
        user_id: userId,
        insight_type: insightType,
        content,
      });

      if (error) throw error;
      toast.success('Insight saved');
    } catch (error) {
      console.error('Save insight error:', error);
      toast.error('Failed to save insight');
    }
  };

  return {
    isLoading,
    insight,
    generateInsight,
    saveInsight,
    clearInsight: () => setInsight(null),
  };
}
