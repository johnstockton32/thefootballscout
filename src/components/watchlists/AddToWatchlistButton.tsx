import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { List, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Watchlist {
  id: string;
  name: string;
  color: string;
}

interface AddToWatchlistButtonProps {
  playerId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function AddToWatchlistButton({ 
  playerId, 
  variant = 'outline',
  size = 'sm',
  className 
}: AddToWatchlistButtonProps) {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [playerWatchlists, setPlayerWatchlists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchWatchlists();
    }
  }, [user, isOpen]);

  const fetchWatchlists = async () => {
    setIsLoading(true);
    try {
      // Fetch user's watchlists
      const { data: watchlistsData, error: watchlistsError } = await supabase
        .from('watchlists')
        .select('id, name, color')
        .order('name');

      if (watchlistsError) throw watchlistsError;
      setWatchlists(watchlistsData || []);

      // Fetch which watchlists this player is in
      const { data: playerData, error: playerError } = await supabase
        .from('watchlist_players')
        .select('watchlist_id')
        .eq('player_id', playerId);

      if (playerError) throw playerError;
      setPlayerWatchlists(new Set(playerData?.map(p => p.watchlist_id) || []));
    } catch (error) {
      console.error('Error fetching watchlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchlist = async (watchlistId: string) => {
    const isInWatchlist = playerWatchlists.has(watchlistId);
    
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist_players')
          .delete()
          .eq('watchlist_id', watchlistId)
          .eq('player_id', playerId);

        if (error) throw error;
        setPlayerWatchlists(prev => {
          const next = new Set(prev);
          next.delete(watchlistId);
          return next;
        });
        toast.success('Removed from watchlist');
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlist_players')
          .insert({
            watchlist_id: watchlistId,
            player_id: playerId,
          });

        if (error) throw error;
        setPlayerWatchlists(prev => new Set([...prev, watchlistId]));
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {size === 'icon' ? (
            <List className="w-4 h-4" />
          ) : (
            <>
              <List className="w-4 h-4 mr-2" />
              Watchlist
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : watchlists.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            <p>No watchlists yet</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/watchlists'}
            >
              Create one
            </Button>
          </div>
        ) : (
          <>
            {watchlists.map((wl) => {
              const isInList = playerWatchlists.has(wl.id);
              return (
                <DropdownMenuItem
                  key={wl.id}
                  onClick={() => toggleWatchlist(wl.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: wl.color }}
                  />
                  <span className="flex-1">{wl.name}</span>
                  {isInList && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = '/watchlists'}
              className="text-muted-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Watchlists
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
