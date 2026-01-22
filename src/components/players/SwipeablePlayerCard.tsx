import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { POSITION_ABBREV, POSITION_LABELS, calculateAge, PlayerPosition } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, User, Trash2, Pencil } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SwipeablePlayerCardProps {
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
  onDelete?: (playerId: string) => void;
}

const SWIPE_THRESHOLD = 80;

export function SwipeablePlayerCard({ player, latestRating, reportsCount = 0, onDelete }: SwipeablePlayerCardProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const age = player.date_of_birth ? calculateAge(player.date_of_birth) : null;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const x = useMotionValue(0);
  
  // Left swipe (delete) transforms
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.8, 0.5]);
  
  // Right swipe (edit) transforms
  const editOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const editScale = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0.5, 0.8, 1]);
  
  const cardOpacity = useTransform(
    x, 
    [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5], 
    [0.5, 0.9, 1, 0.9, 0.5]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left - delete
      setShowDeleteDialog(true);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe right - edit (navigate to detail page with edit mode)
      navigate(`/players/${player.id}?edit=true`);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      await onDelete(player.id);
      setIsDeleting(false);
    }
    setShowDeleteDialog(false);
  };

  const handleCardClick = () => {
    // Only navigate if not swiping
    if (Math.abs(x.get()) < 10) {
      navigate(`/players/${player.id}`);
    }
  };

  // Non-mobile: regular card
  if (!isMobile) {
    return (
      <Link to={`/players/${player.id}`} className="block">
        <Card className="card-glass player-card-shine overflow-hidden group hover:border-primary/30 transition-all duration-300 hover-scale active:scale-[0.98]">
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="w-8 h-8 text-primary/50" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{POSITION_ABBREV[player.position]}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{player.full_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{POSITION_LABELS[player.position]}</p>
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

            {player.current_club && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground truncate">{player.current_club}</p>
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Mobile: swipeable card with edit and delete
  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Edit action background (right swipe) */}
        <motion.div 
          className="absolute inset-0 bg-primary flex items-center justify-start pl-6 rounded-xl"
          style={{ opacity: editOpacity }}
        >
          <motion.div style={{ scale: editScale }} className="flex flex-col items-center gap-1">
            <Pencil className="w-6 h-6 text-primary-foreground" />
            <span className="text-xs text-primary-foreground font-medium">Edit</span>
          </motion.div>
        </motion.div>

        {/* Delete action background (left swipe) */}
        <motion.div 
          className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 rounded-xl"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
            <Trash2 className="w-6 h-6 text-destructive-foreground" />
            <span className="text-xs text-destructive-foreground font-medium">Delete</span>
          </motion.div>
        </motion.div>

        {/* Swipeable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -SWIPE_THRESHOLD * 1.2, right: SWIPE_THRESHOLD * 1.2 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x, opacity: cardOpacity }}
          whileTap={{ cursor: 'grabbing' }}
          onClick={handleCardClick}
        >
          <Card className="card-glass player-card-shine overflow-hidden transition-all duration-300 active:scale-[0.98]">
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <User className="w-7 h-7 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary-foreground">{POSITION_ABBREV[player.position]}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate text-sm">{player.full_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{POSITION_LABELS[player.position]}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
                    {age && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {age}
                      </span>
                    )}
                    {player.nationality && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {player.nationality}
                      </span>
                    )}
                  </div>
                </div>

                {latestRating !== undefined && latestRating !== null && (
                  <div className="flex flex-col items-end">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white',
                      latestRating >= 70 && 'bg-gradient-to-br from-rating to-rating-light',
                      latestRating < 70 && latestRating >= 50 && 'bg-primary',
                      latestRating < 50 && 'bg-muted text-foreground'
                    )}>
                      {Math.round(latestRating)}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {reportsCount} rpt{reportsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {player.current_club && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground truncate">{player.current_club}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {player.full_name}? This will also remove all their scouting reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
