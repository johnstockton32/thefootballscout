import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ScoutingReport = Tables<'scouting_reports'>;
type ReportInsert = TablesInsert<'scouting_reports'>;
type ReportUpdate = TablesUpdate<'scouting_reports'>;

// Extended type that includes player info
export type ReportWithPlayer = ScoutingReport & {
  players: {
    id: string;
    full_name: string;
    position: string;
  } | null;
};

export function useOfflineReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = navigator.onLine;

  // Fetch reports from server and cache them
  const fetchReports = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('scouting_reports')
          .select('*, players(id, full_name, position)')
          .eq('scout_id', user.id)
          .order('match_date', { ascending: false });

        if (error) throw error;

        if (data) {
          await offlineStorage.cacheRecords('scouting_reports', data);
          
          const localRecords = await offlineStorage.getLocalRecords('scouting_reports');
          const merged = [...localRecords.filter(l => l.scout_id === user.id), ...data];
          
          const unique = merged.reduce((acc, report) => {
            const existing = acc.find((r: ReportWithPlayer) => r.id === report.id);
            if (!existing) acc.push(report as ReportWithPlayer);
            return acc;
          }, [] as ReportWithPlayer[]);

          setReports(unique);
        }
      } else {
        const cached = await offlineStorage.getCachedRecords('scouting_reports');
        const local = await offlineStorage.getLocalRecords('scouting_reports');
        const merged = [...local.filter(l => l.scout_id === user.id), ...cached.filter(c => c.scout_id === user.id)];
        
        const unique = merged.reduce((acc, report) => {
          const existing = acc.find((r: ReportWithPlayer) => r.id === report.id);
          if (!existing) acc.push(report as ReportWithPlayer);
          return acc;
        }, [] as ReportWithPlayer[]);

        setReports(unique);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      const cached = await offlineStorage.getCachedRecords('scouting_reports');
      setReports(cached.filter(c => c.scout_id === user?.id));
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  // Create a report (works offline)
  const createReport = useCallback(async (reportData: Omit<ReportInsert, 'id' | 'created_at' | 'updated_at' | 'scout_id'>): Promise<ScoutingReport | null> => {
    if (!user) return null;

    const now = new Date().toISOString();
    const newReport = {
      ...reportData,
      id: crypto.randomUUID(),
      scout_id: user.id,
      created_at: now,
      updated_at: now,
      is_draft: reportData.is_draft ?? false,
      opposition: reportData.opposition ?? null,
      match_details: reportData.match_details ?? null,
      minutes_observed: reportData.minutes_observed ?? null,
      overall_rating: reportData.overall_rating ?? null,
      potential_rating: reportData.potential_rating ?? null,
      recommendation: reportData.recommendation ?? null,
      strengths: reportData.strengths ?? null,
      weaknesses: reportData.weaknesses ?? null,
      technical_passing: reportData.technical_passing ?? null,
      technical_dribbling: reportData.technical_dribbling ?? null,
      technical_shooting: reportData.technical_shooting ?? null,
      technical_first_touch: reportData.technical_first_touch ?? null,
      technical_crossing: reportData.technical_crossing ?? null,
      technical_heading: reportData.technical_heading ?? null,
      tactical_positioning: reportData.tactical_positioning ?? null,
      tactical_awareness: reportData.tactical_awareness ?? null,
      tactical_decision_making: reportData.tactical_decision_making ?? null,
      tactical_off_ball_movement: reportData.tactical_off_ball_movement ?? null,
      tactical_defensive_contribution: reportData.tactical_defensive_contribution ?? null,
      physical_pace: reportData.physical_pace ?? null,
      physical_strength: reportData.physical_strength ?? null,
      physical_stamina: reportData.physical_stamina ?? null,
      physical_agility: reportData.physical_agility ?? null,
      physical_balance: reportData.physical_balance ?? null,
      mental_composure: reportData.mental_composure ?? null,
      mental_concentration: reportData.mental_concentration ?? null,
      mental_leadership: reportData.mental_leadership ?? null,
      mental_work_rate: reportData.mental_work_rate ?? null,
      mental_aggression: reportData.mental_aggression ?? null,
    } as ScoutingReport;

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('scouting_reports')
          .insert(newReport)
          .select('*, players(id, full_name, position)')
          .single();

        if (error) throw error;
        
        await offlineStorage.cacheRecord('scouting_reports', data.id, data);
        setReports(prev => [data as ReportWithPlayer, ...prev]);
        return data;
      } else {
        await offlineStorage.saveLocalRecord('scouting_reports', newReport.id, newReport);
        await offlineStorage.addToSyncQueue({
          type: 'create',
          table: 'scouting_reports',
          data: newReport,
        });

        const reportWithPlayer: ReportWithPlayer = { ...newReport, players: null };
        setReports(prev => [reportWithPlayer, ...prev]);
        toast.info('Report saved offline. Will sync when online.');
        return newReport;
      }
    } catch (error) {
      console.error('Error creating report:', error);
      
      await offlineStorage.saveLocalRecord('scouting_reports', newReport.id, newReport);
      await offlineStorage.addToSyncQueue({
        type: 'create',
        table: 'scouting_reports',
        data: newReport,
      });

      const reportWithPlayer: ReportWithPlayer = { ...newReport, players: null };
      setReports(prev => [reportWithPlayer, ...prev]);
      toast.info('Report saved offline. Will sync when online.');
      return newReport;
    }
  }, [user, isOnline]);

  // Update a report (works offline)
  const updateReport = useCallback(async (id: string, updates: ReportUpdate): Promise<boolean> => {
    const updatedData: ReportUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('scouting_reports')
          .update(updatedData)
          .eq('id', id);

        if (error) throw error;

        const existing = await offlineStorage.getCachedRecord('scouting_reports', id);
        if (existing) {
          await offlineStorage.cacheRecord('scouting_reports', id, { ...existing, ...updatedData });
        }

        setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
        return true;
      } else {
        await offlineStorage.addToSyncQueue({
          type: 'update',
          table: 'scouting_reports',
          data: updatedData,
        });

        const existing = await offlineStorage.getCachedRecord('scouting_reports', id) || 
                         await offlineStorage.getLocalRecords('scouting_reports').then(r => r.find(rep => rep.id === id));
        
        if (existing) {
          const merged = { ...existing, ...updatedData };
          await offlineStorage.cacheRecord('scouting_reports', id, merged);
        }

        setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
        toast.info('Changes saved offline. Will sync when online.');
        return true;
      }
    } catch (error) {
      console.error('Error updating report:', error);
      
      await offlineStorage.addToSyncQueue({
        type: 'update',
        table: 'scouting_reports',
        data: updatedData,
      });
      
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
      toast.info('Changes saved offline. Will sync when online.');
      return true;
    }
  }, [isOnline]);

  // Delete a report (works offline)
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isOnline) {
        const { error } = await supabase
          .from('scouting_reports')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await offlineStorage.deleteCachedRecord('scouting_reports', id);
        await offlineStorage.deleteLocalRecord('scouting_reports', id);
        setReports(prev => prev.filter(r => r.id !== id));
        return true;
      } else {
        await offlineStorage.addToSyncQueue({
          type: 'delete',
          table: 'scouting_reports',
          data: { id },
        });

        await offlineStorage.deleteCachedRecord('scouting_reports', id);
        await offlineStorage.deleteLocalRecord('scouting_reports', id);
        setReports(prev => prev.filter(r => r.id !== id));
        toast.info('Report will be deleted when online.');
        return true;
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      
      await offlineStorage.addToSyncQueue({
        type: 'delete',
        table: 'scouting_reports',
        data: { id },
      });
      
      setReports(prev => prev.filter(r => r.id !== id));
      toast.info('Report will be deleted when online.');
      return true;
    }
  }, [isOnline]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const handleOnline = () => {
      fetchReports();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    isOnline,
    createReport,
    updateReport,
    deleteReport,
    refetch: fetchReports,
  };
}
