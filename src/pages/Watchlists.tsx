import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase, POSITION_ABBREV, PlayerPosition } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus,
  List,
  Users,
  Trash2,
  Edit,
  Star,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerPhotoImg } from '@/components/players/PlayerPhotoAvatar';

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  player_count?: number;
}

interface WatchlistPlayer {
  id: string;
  player_id: string;
  added_at: string;
  notes: string | null;
  priority: number;
  players: {
    id: string;
    full_name: string;
    position: PlayerPosition;
    current_club: string | null;
    photo_url: string | null;
  };
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function Watchlists() {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [watchlistPlayers, setWatchlistPlayers] = useState<WatchlistPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[0],
  });

  useEffect(() => {
    if (user) {
      fetchWatchlists();
    }
  }, [user]);

  useEffect(() => {
    if (selectedWatchlist) {
      fetchWatchlistPlayers(selectedWatchlist.id);
    }
  }, [selectedWatchlist]);

  const fetchWatchlists = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get player counts
      const watchlistsWithCounts = await Promise.all(
        (data || []).map(async (wl) => {
          const { count } = await supabase
            .from('watchlist_players')
            .select('*', { count: 'exact', head: true })
            .eq('watchlist_id', wl.id);
          return { ...wl, player_count: count || 0 };
        })
      );

      setWatchlists(watchlistsWithCounts);
      if (watchlistsWithCounts.length > 0 && !selectedWatchlist) {
        setSelectedWatchlist(watchlistsWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      toast.error('Failed to load watchlists');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWatchlistPlayers = async (watchlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('watchlist_players')
        .select(`
          *,
          players (
            id,
            full_name,
            position,
            current_club,
            photo_url
          )
        `)
        .eq('watchlist_id', watchlistId)
        .order('priority', { ascending: false });

      if (error) throw error;
      setWatchlistPlayers(data as unknown as WatchlistPlayer[] || []);
    } catch (error) {
      console.error('Error fetching watchlist players:', error);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingWatchlist) {
        const { error } = await supabase
          .from('watchlists')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
          })
          .eq('id', editingWatchlist.id);

        if (error) throw error;
        toast.success('Watchlist updated');
      } else {
        const { error } = await supabase
          .from('watchlists')
          .insert({
            user_id: user!.id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
          });

        if (error) throw error;
        toast.success('Watchlist created');
      }

      setIsDialogOpen(false);
      setEditingWatchlist(null);
      setFormData({ name: '', description: '', color: COLORS[0] });
      fetchWatchlists();
    } catch (error) {
      console.error('Error saving watchlist:', error);
      toast.error('Failed to save watchlist');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Watchlist deleted');
      
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(null);
        setWatchlistPlayers([]);
      }
      fetchWatchlists();
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      toast.error('Failed to delete watchlist');
    }
  };

  const handleRemovePlayer = async (watchlistPlayerId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist_players')
        .delete()
        .eq('id', watchlistPlayerId);

      if (error) throw error;
      toast.success('Player removed from watchlist');
      if (selectedWatchlist) {
        fetchWatchlistPlayers(selectedWatchlist.id);
        fetchWatchlists();
      }
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Failed to remove player');
    }
  };

  const openEditDialog = (watchlist: Watchlist) => {
    setEditingWatchlist(watchlist);
    setFormData({
      name: watchlist.name,
      description: watchlist.description || '',
      color: watchlist.color,
    });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Watchlists</h1>
            <p className="text-muted-foreground mt-1">
              Organize players into custom shortlists
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingWatchlist(null);
              setFormData({ name: '', description: '', color: COLORS[0] });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWatchlist ? 'Edit Watchlist' : 'Create Watchlist'}
                </DialogTitle>
                <DialogDescription>
                  {editingWatchlist ? 'Update your watchlist details' : 'Create a new watchlist to organize players'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Top Strikers, Transfer Targets"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform",
                          formData.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdate}>
                  {editingWatchlist ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="h-48 md:h-64 bg-muted rounded-xl animate-pulse" />
            <div className="md:col-span-2 h-48 md:h-64 bg-muted rounded-xl animate-pulse" />
          </div>
        ) : watchlists.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="py-16 text-center">
              <List className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No watchlists yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first watchlist to start organizing players
              </p>
              <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Watchlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Watchlist Sidebar - horizontal scroll on mobile */}
            <div className="md:space-y-3 flex md:flex-col gap-3 md:gap-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-thin">
              {watchlists.map((wl) => (
                <Card
                  key={wl.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md flex-shrink-0 md:flex-shrink min-w-[200px] md:min-w-0",
                    selectedWatchlist?.id === wl.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedWatchlist(wl)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: wl.color }}
                        />
                        <div>
                          <h3 className="font-semibold">{wl.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {wl.player_count} player{wl.player_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(wl);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{wl.name}" and remove all players from it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(wl.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Players List */}
            <div className="md:col-span-2">
              {selectedWatchlist ? (
                <Card className="card-glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedWatchlist.color }}
                      />
                      <div>
                        <CardTitle>{selectedWatchlist.name}</CardTitle>
                        {selectedWatchlist.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedWatchlist.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {watchlistPlayers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">
                          No players in this watchlist
                        </p>
                        <Button variant="outline" asChild>
                          <Link to="/players">
                            Browse Players
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {watchlistPlayers.map((wp) => (
                          <div
                            key={wp.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <Link
                              to={`/players/${wp.players.id}`}
                              className="flex items-center gap-3 min-w-0 flex-1 hover:text-primary transition-colors"
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                                <PlayerPhotoImg
                                  photoUrl={wp.players.photo_url}
                                  playerName={wp.players.full_name}
                                  className="w-full h-full object-cover"
                                  fallback={<Users className="w-5 h-5 text-primary" />}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{wp.players.full_name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge className="position-badge text-xs">
                                    {POSITION_ABBREV[wp.players.position]}
                                  </Badge>
                                  {wp.players.current_club && (
                                    <span className="truncate">{wp.players.current_club}</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              {wp.priority > 0 && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link to={`/players/${wp.players.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemovePlayer(wp.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-glass">
                  <CardContent className="py-16 text-center">
                    <List className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a watchlist to view players</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
