import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY = 3600; // 1 hour
const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Given a storage path (not a full URL), returns a signed URL.
 * Handles both legacy full public URLs and new path-only values.
 */
export function extractStoragePath(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  // If it's already a bare path (no http), return as-is
  if (!photoUrl.startsWith('http')) return photoUrl;
  // Extract path from a full Supabase storage URL
  const match = photoUrl.match(/player-photos\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

export function useSignedUrl(bucket: string, path: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Listen for auth state so we re-fetch signed URLs once the user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!path || !sessionReady) {
      if (!sessionReady) return; // wait for session
      setSignedUrl(null);
      return;
    }

    const cacheKey = `${bucket}/${path}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSignedUrl(cached.url);
      return;
    }

    let cancelled = false;

    supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          console.warn(`[useSignedUrl] Failed to sign ${bucket}/${path}:`, error?.message);
          setSignedUrl(null);
          return;
        }
        cache.set(cacheKey, {
          url: data.signedUrl,
          expiresAt: Date.now() + (SIGNED_URL_EXPIRY - 60) * 1000,
        });
        setSignedUrl(data.signedUrl);
      });

    return () => { cancelled = true; };
  }, [bucket, path, sessionReady]);

  return signedUrl;
}

/**
 * Hook for player photo URLs specifically.
 * Accepts the photo_url field which may be a full URL (legacy) or a path.
 */
export function usePlayerPhotoUrl(photoUrl: string | null) {
  const path = extractStoragePath(photoUrl);
  return useSignedUrl('player-photos', path);
}
