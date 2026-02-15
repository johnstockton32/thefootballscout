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
    <Link ref={ref} to={`/players/${player.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/25 active:scale-[0.98] relative">
        {/* Football accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-lg" />
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Player Photo/Avatar */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={player.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <User className="w-7 h-7 text-primary/40" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {player.full_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-md">
                  {POSITION_ABBREV[player.position]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {POSITION_LABELS[player.position]}
                </span>
              </div>
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
                  'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold',
                  latestRating >= 70 && 'bg-primary/10 text-primary',
                  latestRating < 70 && latestRating >= 50 && 'bg-accent/10 text-accent',
                  latestRating < 50 && 'bg-secondary text-muted-foreground'
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
            <div className="mt-3 pt-3 border-t border-border">
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
