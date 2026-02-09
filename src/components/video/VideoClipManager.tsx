import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Video, Plus, Trash2, Upload, Play, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoClip {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  created_at: string;
}

interface VideoClipManagerProps {
  reportId: string;
  className?: string;
}

function VideoClipItem({ clip, onDelete }: { clip: VideoClip; onDelete: (id: string) => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    // If the URL is already a full URL (external link like YouTube), use it directly
    if (clip.video_url.startsWith('http')) {
      setSignedUrl(clip.video_url);
      return;
    }
    // Otherwise, generate a signed URL for the private bucket
    supabase.storage
      .from('video-clips')
      .createSignedUrl(clip.video_url, 3600)
      .then(({ data, error }) => {
        if (data?.signedUrl) setSignedUrl(data.signedUrl);
        else console.warn('Failed to sign video URL:', error?.message);
      });
  }, [clip.video_url]);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Play className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{clip.title}</p>
          {clip.description && (
            <p className="text-sm text-muted-foreground truncate">{clip.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => signedUrl && window.open(signedUrl, '_blank')}
          disabled={!signedUrl}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Video Clip</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove &quot;{clip.title}&quot; from this report.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(clip.id)}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function VideoClipManager({ reportId, className }: VideoClipManagerProps) {
  const { user } = useAuth();
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClips();
  }, [reportId]);

  const fetchClips = async () => {
    try {
      const { data, error } = await supabase
        .from('video_clips')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClips(data as VideoClip[] || []);
    } catch (error) {
      console.error('Error fetching clips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${reportId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('video-clips')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the path only (not a full URL) for private bucket
      setFormData({ ...formData, video_url: fileName });
      toast.success('Video uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveClip = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.video_url.trim()) {
      toast.error('Video URL is required');
      return;
    }

    try {
      const { error } = await supabase.from('video_clips').insert({
        report_id: reportId,
        user_id: user!.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        video_url: formData.video_url.trim(),
      });

      if (error) throw error;

      toast.success('Video clip added');
      setIsDialogOpen(false);
      setFormData({ title: '', description: '', video_url: '' });
      fetchClips();
    } catch (error) {
      console.error('Error saving clip:', error);
      toast.error('Failed to save video clip');
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      const { error } = await supabase
        .from('video_clips')
        .delete()
        .eq('id', clipId);

      if (error) throw error;
      toast.success('Video clip deleted');
      fetchClips();
    } catch (error) {
      console.error('Error deleting clip:', error);
      toast.error('Failed to delete clip');
    }
  };

  return (
    <Card className={cn("card-glass", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Video Clips
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Clip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Video Clip</DialogTitle>
              <DialogDescription>
                Attach a video clip to this scouting report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Goal vs Liverpool"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the clip..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Video</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="Paste video URL or upload"
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a video (max 100MB) or paste a YouTube/Vimeo URL
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveClip} disabled={isUploading}>
                Add Clip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : clips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No video clips attached</p>
            <p className="text-sm">Add clips to support your scouting observations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip) => (
              <VideoClipItem key={clip.id} clip={clip} onDelete={handleDeleteClip} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
