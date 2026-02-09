import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  Flag,
  Eye,
  TrendingUp,
  AlertTriangle,
  Award,
  Milestone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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

const NOTE_TYPES = {
  observation: { label: 'Observation', icon: Eye, color: 'bg-primary/10 text-primary' },
  milestone: { label: 'Milestone', icon: Award, color: 'bg-amber-500/10 text-amber-500' },
  improvement: { label: 'Improvement', icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-500' },
  concern: { label: 'Concern', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
  transfer: { label: 'Transfer Update', icon: Flag, color: 'bg-purple-500/10 text-purple-500' },
} as const;

type NoteType = keyof typeof NOTE_TYPES;

interface DevelopmentNote {
  id: string;
  note_type: NoteType;
  title: string;
  content: string | null;
  rating_snapshot: number | null;
  created_at: string;
}

interface PlayerDevelopmentTimelineProps {
  playerId: string;
  currentAvgRating: number | null;
}

export function PlayerDevelopmentTimeline({ playerId, currentAvgRating }: PlayerDevelopmentTimelineProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DevelopmentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [newNote, setNewNote] = useState({
    note_type: 'observation' as NoteType,
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchNotes();
  }, [playerId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('player_development_notes')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as DevelopmentNote[]) || []);
    } catch (error) {
      console.error('Error fetching development notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user || !newNote.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('player_development_notes')
        .insert({
          player_id: playerId,
          scout_id: user.id,
          note_type: newNote.note_type,
          title: newNote.title.trim(),
          content: newNote.content.trim() || null,
          rating_snapshot: currentAvgRating,
        });

      if (error) throw error;

      toast.success('Development note added');
      setNewNote({ note_type: 'observation', title: '', content: '' });
      setIsAdding(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('player_development_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const displayedNotes = showAll ? notes : notes.slice(0, 5);

  return (
    <Card className="card-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Milestone className="w-5 h-5 text-primary" />
          Development Timeline
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAdding && (
          <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <Select
              value={newNote.note_type}
              onValueChange={(v) => setNewNote(prev => ({ ...prev, note_type: v as NoteType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_TYPES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Title (e.g., 'Promoted to first team')"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              className="bg-input"
            />
            <Textarea
              placeholder="Additional details (optional)"
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              className="bg-input min-h-[60px]"
            />
            {currentAvgRating !== null && (
              <p className="text-xs text-muted-foreground">
                Current rating snapshot: <span className="font-semibold">{currentAvgRating}</span>
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button variant="hero" size="sm" onClick={handleAdd} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <Milestone className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No development notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Track milestones, improvements, and concerns over time
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-3">
              {displayedNotes.map((note) => {
                const typeConfig = NOTE_TYPES[note.note_type] || NOTE_TYPES.observation;
                const Icon = typeConfig.icon;

                return (
                  <div key={note.id} className="relative flex gap-3 group">
                    {/* Timeline dot */}
                    <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeConfig.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{note.title}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {typeConfig.label}
                            </Badge>
                          </div>
                          {note.content && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                            {note.rating_snapshot !== null && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Rating: {note.rating_snapshot}
                              </span>
                            )}
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this development note.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(note.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {notes.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show All ({notes.length} notes)
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
