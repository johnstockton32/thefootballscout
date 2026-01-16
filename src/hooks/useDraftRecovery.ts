import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Draft {
  id: string;
  player_id: string;
  match_date: string;
  created_at: string;
  updated_at: string;
  player_name?: string;
}

export function useDraftRecovery() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDrafts, setHasDrafts] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scouting_reports')
        .select(`
          id,
          player_id,
          match_date,
          created_at,
          updated_at,
          players (
            full_name
          )
        `)
        .eq('scout_id', user.id)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedDrafts: Draft[] = (data || []).map((d: any) => ({
        id: d.id,
        player_id: d.player_id,
        match_date: d.match_date,
        created_at: d.created_at,
        updated_at: d.updated_at,
        player_name: d.players?.full_name || 'Unknown Player',
      }));

      setDrafts(formattedDrafts);
      setHasDrafts(formattedDrafts.length > 0);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('scouting_reports')
        .delete()
        .eq('id', draftId)
        .eq('is_draft', true);

      if (error) throw error;

      setDrafts(prev => prev.filter(d => d.id !== draftId));
      setHasDrafts(drafts.length - 1 > 0);
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  };

  return {
    drafts,
    hasDrafts,
    isLoading,
    fetchDrafts,
    deleteDraft,
  };
}
