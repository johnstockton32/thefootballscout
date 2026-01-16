import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDraftRecovery } from '@/hooks/useDraftRecovery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileEdit, X, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function DraftRecoveryBanner() {
  const { drafts, hasDrafts, isLoading, deleteDraft } = useDraftRecovery();
  const [dismissed, setDismissed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading || !hasDrafts || dismissed) {
    return null;
  }

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(draftId);
    
    const success = await deleteDraft(draftId);
    if (success) {
      toast.success('Draft discarded');
    } else {
      toast.error('Failed to delete draft');
    }
    setDeletingId(null);
  };

  return (
    <Alert className="mb-6 border-primary/30 bg-primary/5">
      <FileEdit className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Unsaved Drafts</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm mb-3">You have {drafts.length} unsaved report draft{drafts.length > 1 ? 's' : ''}:</p>
        <div className="space-y-2">
          {drafts.slice(0, 3).map((draft) => (
            <div 
              key={draft.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
            >
              <Link 
                to={`/reports/new?draftId=${draft.id}`}
                className="flex-1 flex items-center gap-2 text-sm"
              >
                <span className="font-medium">{draft.player_name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                </span>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteDraft(draft.id, e)}
                disabled={deletingId === draft.id}
                className="h-8 w-8 p-0 ml-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
