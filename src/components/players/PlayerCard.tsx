import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { POSITION_ABBREV, POSITION_LABELS, calculateAge, getRatingColor, PlayerPosition } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, User } from 'lucide-react';
import { usePlayerPhotoUrl } from '@/hooks/useSignedUrl';

interface PlayerCardProps {
  player: {
    id: string;
    full_name: string;
    position: PlayerPosition;
    date_of_birth: string | null;
    nationality: string | null;
    current_club: string | null;
    photo_url: string | null;
  };
  latestRating?: number | null;
  reportsCount?: number;
}

export const PlayerCard = forwardRef<HTMLAnchorElement, PlayerCardProps>(function PlayerCard({ player, latestRating, reportsCount = 0 }, ref) {
  const age = player.date_of_birth ? calculateAge(player.date_of_birth) : null;
  const photoUrl = usePlayerPhotoUrl(player.photo_url);

  return (
    <Link ref={ref} to={`/players/${player.id}`} className="block">
      <Card className="card-glass player-card-shine overflow-hidden group hover:border-primary/30 transition-all duration-300 hover-scale active:scale-[0.98]">
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-4">
            {/* Player Photo/Avatar */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={player.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-8 h-8 text-primary/50" />
                </div>
              )}
              {/* Position Badge Overlay */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">
                  {POSITION_ABBREV[player.position]}
                </span>
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {player.full_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {POSITION_LABELS[player.position]}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {age} yrs
                  </span>
                )}
                {player.nationality && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {player.nationality}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            {latestRating !== undefined && latestRating !== null && (
              <div className="flex flex-col items-end">
                <div className={cn(
                  'rating-badge-lg',
                  latestRating >= 70 && 'bg-gradient-to-br from-rating to-rating-light',
                  latestRating < 70 && latestRating >= 50 && 'bg-primary',
                  latestRating < 50 && 'bg-muted text-foreground'
                )}>
                  {Math.round(latestRating)}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {reportsCount} report{reportsCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Club Info */}
          {player.current_club && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground truncate">
                {player.current_club}
              </p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
});
