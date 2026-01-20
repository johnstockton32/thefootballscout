import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompetitionLevel, COMPETITION_LEVEL_LABELS } from '@/lib/supabase';
import { format } from 'date-fns';
import { FileText, Calendar, Trash2, Lock, User } from 'lucide-react';
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

interface ReportCardProps {
  report: {
    id: string;
    match_date: string;
    opposition: string | null;
    competition_level: CompetitionLevel;
    overall_rating: number | null;
    recommendation: string | null;
    is_draft: boolean | null;
    is_private: boolean;
    players: {
      id: string;
      full_name: string;
      position: string;
    } | null;
  };
  onDelete?: (reportId: string) => void;
}

const SWIPE_THRESHOLD = 100;

const getRecommendationColor = (rec: string | null) => {
  switch (rec) {
    case 'Sign': return 'bg-primary text-primary-foreground';
    case 'Monitor': return 'bg-amber-500 text-white';
    case 'Reject': return 'bg-destructive text-destructive-foreground';
    default: return '';
  }
};

export function SwipeableReportCard({ report, onDelete }: ReportCardProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, -50, 0], [1, 0.8, 0.5]);
  const cardOpacity = useTransform(x, [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD, 0], [0.5, 0.9, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setShowDeleteDialog(true);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      await onDelete(report.id);
      setIsDeleting(false);
    }
    setShowDeleteDialog(false);
  };

  const handleCardClick = () => {
    if (Math.abs(x.get()) < 10) {
      navigate(`/reports/${report.id}`);
    }
  };

  // Desktop card (unchanged look)
  if (!isMobile) {
    return (
      <div onClick={() => navigate(`/reports/${report.id}`)} className="cursor-pointer">
        <Card className="card-glass hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate flex items-center gap-2">
                      {report.players?.full_name ? (
                        <>
                          <User className="w-4 h-4 text-primary flex-shrink-0" />
                          {report.players.full_name}
                        </>
                      ) : (
                        `Report #${report.id.slice(0, 8)}`
                      )}
                    </h3>
                    {report.is_draft && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">Draft</span>
                    )}
                    {report.is_private && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(report.match_date), 'MMM d, yyyy')}
                    </span>
                    {report.opposition && <span>vs {report.opposition}</span>}
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                      {COMPETITION_LEVEL_LABELS[report.competition_level]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {report.recommendation && !report.is_draft && (
                  <Badge className={getRecommendationColor(report.recommendation)}>{report.recommendation}</Badge>
                )}
                {report.overall_rating && !report.is_draft && (
                  <div className="rating-badge-lg">{Math.round(report.overall_rating)}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile: optimized swipeable card
  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Delete action background */}
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
          dragConstraints={{ left: -SWIPE_THRESHOLD * 1.2, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x, opacity: cardOpacity }}
          whileTap={{ cursor: 'grabbing' }}
          onClick={handleCardClick}
        >
          <Card className="card-glass overflow-hidden">
            <CardContent className="p-3">
              {/* Mobile-optimized layout */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Player name + badges */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm truncate max-w-[140px]">
                      {report.players?.full_name || `Report #${report.id.slice(0, 6)}`}
                    </h3>
                    {report.is_draft && (
                      <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">Draft</span>
                    )}
                    {report.is_private && (
                      <Lock className="w-3 h-3 text-amber-600" />
                    )}
                  </div>

                  {/* Date and opposition */}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(report.match_date), 'MMM d')}
                    </span>
                    {report.opposition && (
                      <span className="truncate max-w-[80px]">vs {report.opposition}</span>
                    )}
                  </div>

                  {/* Competition level */}
                  <div className="mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full">
                      {COMPETITION_LEVEL_LABELS[report.competition_level]}
                    </span>
                  </div>
                </div>

                {/* Rating & Recommendation */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {report.overall_rating && !report.is_draft && (
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">
                        {Math.round(report.overall_rating)}
                      </span>
                    </div>
                  )}
                  {report.recommendation && !report.is_draft && (
                    <Badge className={`text-[9px] px-1.5 py-0.5 ${getRecommendationColor(report.recommendation)}`}>
                      {report.recommendation}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scouting report for {report.players?.full_name || 'this player'}? This action cannot be undone.
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
