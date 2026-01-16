import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Player = Tables<'players'>;
type PlayerInsert = TablesInsert<'players'>;
type PlayerUpdate = TablesUpdate<'players'>;
export function useOfflinePlayers() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = navigator.onLine;

  // Fetch players from server and cache them
  const fetchPlayers = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('scout_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Cache the data
        if (data) {
          await offlineStorage.cacheRecords('players', data);
          
          // Merge with local records
          const localRecords = await offlineStorage.getLocalRecords('players');
          const merged = [...localRecords.filter(l => l.scout_id === user.id), ...data];
          
          // Deduplicate by ID (prefer local records)
          const unique = merged.reduce((acc, player) => {
            const existing = acc.find((p: Player) => p.id === player.id);
            if (!existing) acc.push(player);
            return acc;
          }, [] as Player[]);

          setPlayers(unique);
        }
      } else {
        // Load from cache when offline
        const cached = await offlineStorage.getCachedRecords('players');
        const local = await offlineStorage.getLocalRecords('players');
        const merged = [...local.filter(l => l.scout_id === user.id), ...cached.filter(c => c.scout_id === user.id)];
        
        const unique = merged.reduce((acc, player) => {
          const existing = acc.find((p: Player) => p.id === player.id);
          if (!existing) acc.push(player);
          return acc;
        }, [] as Player[]);

        setPlayers(unique);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      // Try to load from cache on error
      const cached = await offlineStorage.getCachedRecords('players');
      setPlayers(cached.filter(c => c.scout_id === user?.id));
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  // Create a player (works offline)
  const createPlayer = useCallback(async (playerData: Omit<PlayerInsert, 'id' | 'created_at' | 'updated_at' | 'scout_id'>): Promise<Player | null> => {
    if (!user) return null;

    const now = new Date().toISOString();
    const newPlayer = {
      ...playerData,
      id: crypto.randomUUID(),
      scout_id: user.id,
      created_at: now,
      updated_at: now,
      // Ensure nullable fields have proper defaults
      current_club: playerData.current_club ?? null,
      date_of_birth: playerData.date_of_birth ?? null,
      height_cm: playerData.height_cm ?? null,
      weight_kg: playerData.weight_kg ?? null,
      nationality: playerData.nationality ?? null,
      preferred_foot: playerData.preferred_foot ?? null,
      secondary_position: playerData.secondary_position ?? null,
      photo_url: playerData.photo_url ?? null,
      notes: playerData.notes ?? null,
    } as Player;

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('players')
          .insert(newPlayer)
          .select()
          .single();

        if (error) throw error;
        
        await offlineStorage.cacheRecord('players', data.id, data);
        setPlayers(prev => [data, ...prev]);
        return data;
      } else {
        // Save locally and queue for sync
        await offlineStorage.saveLocalRecord('players', newPlayer.id, newPlayer);
        await offlineStorage.addToSyncQueue({
          type: 'create',
          table: 'players',
          data: newPlayer,
        });

        setPlayers(prev => [newPlayer, ...prev]);
        toast.info('Player saved offline. Will sync when online.');
        return newPlayer;
      }
    } catch (error) {
      console.error('Error creating player:', error);
      
      // Fallback to offline save
      await offlineStorage.saveLocalRecord('players', newPlayer.id, newPlayer);
      await offlineStorage.addToSyncQueue({
        type: 'create',
        table: 'players',
        data: newPlayer,
      });

      setPlayers(prev => [newPlayer, ...prev]);
      toast.info('Player saved offline. Will sync when online.');
      return newPlayer;
    }
  }, [user, isOnline]);

  // Update a player (works offline)
  const updatePlayer = useCallback(async (id: string, updates: PlayerUpdate): Promise<boolean> => {
    const updatedData: PlayerUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('players')
          .update(updatedData)
          .eq('id', id);

        if (error) throw error;

        // Update cache
        const existing = await offlineStorage.getCachedRecord('players', id);
        if (existing) {
          await offlineStorage.cacheRecord('players', id, { ...existing, ...updatedData });
        }

        setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        return true;
      } else {
        // Queue for sync
        await offlineStorage.addToSyncQueue({
          type: 'update',
          table: 'players',
          data: updatedData,
        });

        // Update local/cached record
        const existing = await offlineStorage.getCachedRecord('players', id) || 
                         await offlineStorage.getLocalRecords('players').then(r => r.find(p => p.id === id));
        
        if (existing) {
          const merged = { ...existing, ...updatedData };
          await offlineStorage.cacheRecord('players', id, merged);
        }

        setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        toast.info('Changes saved offline. Will sync when online.');
        return true;
      }
    } catch (error) {
      console.error('Error updating player:', error);
      
      // Fallback to offline
      await offlineStorage.addToSyncQueue({
        type: 'update',
        table: 'players',
        data: updatedData,
      });
      
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
      toast.info('Changes saved offline. Will sync when online.');
      return true;
    }
  }, [isOnline]);

  // Delete a player (works offline)
  const deletePlayer = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isOnline) {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await offlineStorage.deleteCachedRecord('players', id);
        await offlineStorage.deleteLocalRecord('players', id);
        setPlayers(prev => prev.filter(p => p.id !== id));
        return true;
      } else {
        // Queue for sync
        await offlineStorage.addToSyncQueue({
          type: 'delete',
          table: 'players',
          data: { id },
        });

        // Mark as deleted locally
        await offlineStorage.deleteCachedRecord('players', id);
        await offlineStorage.deleteLocalRecord('players', id);
        setPlayers(prev => prev.filter(p => p.id !== id));
        toast.info('Player will be deleted when online.');
        return true;
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      
      await offlineStorage.addToSyncQueue({
        type: 'delete',
        table: 'players',
        data: { id },
      });
      
      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.info('Player will be deleted when online.');
      return true;
    }
  }, [isOnline]);

  // Initial fetch
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Refetch when coming back online
  useEffect(() => {
    const handleOnline = () => {
      fetchPlayers();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchPlayers]);

  return {
    players,
    isLoading,
    isOnline,
    createPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers,
  };
}
