import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlayerCard } from '@/components/players/PlayerCard';
import { BulkCSVImport } from '@/components/players/BulkCSVImport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonList } from '@/components/ui/skeleton-card';
import { PlayerPosition, POSITION_LABELS } from '@/lib/supabase';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflinePlayers } from '@/hooks/useOfflinePlayers';
import { Plus, Search, Users, Filter, ArrowLeft, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

interface Player {
  id: string;
  full_name: string;
  position: PlayerPosition;
  date_of_birth: string | null;
  nationality: string | null;
  current_club: string | null;
  photo_url: string | null;
}

export default function Players() {
  const navigate = useNavigate();
  // Use offline-capable hook instead of direct Supabase queries
  const { players, isLoading, isOnline, refetch } = useOfflinePlayers();
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    let filtered = [...players] as Player[];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(query) ||
          p.current_club?.toLowerCase().includes(query) ||
          p.nationality?.toLowerCase().includes(query)
      );
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter((p) => p.position === positionFilter);
    }

    setFilteredPlayers(filtered);
  }, [players, searchQuery, positionFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 text-sm">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>You're offline. Showing cached data.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm">Back</span>
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {players.length} player{players.length !== 1 ? 's' : ''} in your database
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <BulkCSVImport onSuccess={refetch} />
            <Button variant="hero" asChild className="flex-1 sm:flex-none">
              <Link to="/players/new">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add Player</span>
                <span className="xs:hidden">Add</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players, clubs, nationality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input"
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-input">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {Object.entries(POSITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Players Grid - Fluid responsive grid */}
        {isLoading ? (
          <div className="grid-fluid-3 gap-3 sm:gap-4">
            <SkeletonList count={6} variant="player" />
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid-fluid-3 gap-3 sm:gap-4">
            {filteredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <PlayerCard player={player} />
              </motion.div>
            ))}
          </div>
        ) : players.length > 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No players found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No players yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building your scouting database by adding your first player
            </p>
            <Button variant="hero" asChild>
              <Link to="/players/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Player
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
