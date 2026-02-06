import { useState, useRef } from 'react';
import { Camera, Trash2, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorUtils';
import { usePlayerPhotoUrl } from '@/hooks/useSignedUrl';

interface PlayerPhotoUploadProps {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  playerName?: string;
  userId: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PlayerPhotoUpload({ 
  photoUrl, 
  onPhotoChange,
  playerName,
  userId
}: PlayerPhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const signedUrl = usePlayerPhotoUrl(photoUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the path, not a public URL
      setLocalPreview(URL.createObjectURL(file));
      onPhotoChange(fileName);
      
      toast({
        title: 'Photo uploaded',
        description: 'Player photo has been uploaded.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: handleError(error, 'uploading photo'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!photoUrl) return;

    try {
      const { extractStoragePath } = await import('@/hooks/useSignedUrl');
      const path = extractStoragePath(photoUrl);
      if (path) {
        await supabase.storage.from('player-photos').remove([path]);
      }
    } catch (error) {
      console.error('Error removing old photo:', error);
    }

    setLocalPreview(null);
    onPhotoChange(null);
  };

  const displayUrl = localPreview || signedUrl;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border-2 border-border">
        <AvatarImage src={displayUrl || undefined} alt={playerName || 'Player'} />
        <AvatarFallback className="text-xl bg-primary/10 text-primary">
          {playerName ? getInitials(playerName) : <User className="h-8 w-8" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFileSelect}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {displayUrl ? 'Change Photo' : 'Add Photo'}
            </>
          )}
        </Button>

        {displayUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
}
