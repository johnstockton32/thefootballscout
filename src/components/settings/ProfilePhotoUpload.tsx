import { useState, useRef } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorUtils';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
  fullName: string | null;
  onPhotoUpdated: (url: string | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfilePhotoUpload({ 
  userId, 
  currentPhotoUrl, 
  fullName,
  onPhotoUpdated 
}: ProfilePhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resolve avatar path to signed URL (handles both legacy full URLs and bare paths)
  const avatarPath = currentPhotoUrl && !currentPhotoUrl.startsWith('http')
    ? currentPhotoUrl
    : currentPhotoUrl?.match(/avatars\/(.+?)(?:\?|$)/)?.[1] || null;
  const signedAvatarUrl = useSignedUrl('avatars', avatarPath);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
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
      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Store only the bare path (not a full URL) so we can use signed URLs
      // Update profile with the storage path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: fileName })
        .eq('id', userId);

      if (updateError) throw updateError;

      onPhotoUpdated(fileName);
      
      toast({
        title: 'Photo uploaded',
        description: 'Your profile photo has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: handleError(error, 'uploading photo'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentPhotoUrl) return;

    setIsDeleting(true);
    try {
      // Extract path from URL
      const pathMatch = currentPhotoUrl.match(/avatars\/(.+?)(?:\?|$)/);
      if (pathMatch) {
        await supabase.storage.from('avatars').remove([pathMatch[1]]);
      }

      // Update profile to remove photo URL
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: null })
        .eq('id', userId);

      if (error) throw error;

      onPhotoUpdated(null);
      
      toast({
        title: 'Photo removed',
        description: 'Your profile photo has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: handleError(error, 'deleting photo'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={signedAvatarUrl || undefined} alt={fullName || 'Profile'} />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {getInitials(fullName)}
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
          disabled={isUploading || isDeleting}
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
              {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>

        {currentPhotoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove Photo
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
}
