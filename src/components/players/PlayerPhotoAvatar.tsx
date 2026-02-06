import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayerPhotoUrl } from '@/hooks/useSignedUrl';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerPhotoAvatarProps {
  photoUrl: string | null;
  playerName?: string;
  className?: string;
  fallbackClassName?: string;
  iconSize?: string;
}

export function PlayerPhotoAvatar({
  photoUrl,
  playerName,
  className,
  fallbackClassName,
  iconSize = 'w-6 h-6',
}: PlayerPhotoAvatarProps) {
  const signedUrl = usePlayerPhotoUrl(photoUrl);

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={signedUrl || undefined} alt={playerName || 'Player'} />
      <AvatarFallback className={fallbackClassName}>
        <User className={iconSize} />
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Simple img-based player photo with signed URL.
 * Use when Avatar component isn't needed.
 */
export function PlayerPhotoImg({
  photoUrl,
  playerName,
  className,
  fallback,
}: {
  photoUrl: string | null;
  playerName?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const signedUrl = usePlayerPhotoUrl(photoUrl);

  if (!signedUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={signedUrl}
      alt={playerName || 'Player'}
      className={className}
    />
  );
}
