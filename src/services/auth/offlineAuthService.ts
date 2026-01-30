// Offline authentication service
// Manages offline login and session caching

import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { offlineAuth } from '@/lib/offlineAuth';
import { 
  fetchUserProfile, 
  fetchUserRoles, 
  type Profile, 
  type AppRole 
} from './profileService';

export interface OfflineLoginResult {
  success: boolean;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  error: Error | null;
}

export interface OnlineLoginResult {
  success: boolean;
  error: Error | null;
}

export async function attemptOnlineLogin(
  email: string,
  password: string
): Promise<OnlineLoginResult> {
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (!error && data.user && data.session) {
    // Cache credentials for offline use
    try {
      const profileData = await fetchUserProfile(data.user.id);
      const userRoles = await fetchUserRoles(data.user.id);
      
      await offlineAuth.cacheSession(
        email,
        password,
        data.user.id,
        profileData,
        userRoles
      );
      
      console.log('[OfflineAuth] Cached session for offline use');
    } catch (cacheError) {
      console.error('[OfflineAuth] Failed to cache session:', cacheError);
    }
  }
  
  return {
    success: !error,
    error: error as Error | null,
  };
}

export async function attemptOfflineLogin(
  email: string,
  password: string
): Promise<OfflineLoginResult> {
  console.log('[OfflineAuth] Attempting offline login');
  
  try {
    const result = await offlineAuth.verifyOfflineCredentials(email, password);
    
    if (result.success && result.session) {
      // Create a mock user object for offline mode
      const offlineUser = {
        id: result.session.userId,
        email: result.session.email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      } as User;
      
      console.log('[OfflineAuth] Offline login successful');
      
      return {
        success: true,
        user: offlineUser,
        profile: result.session.profile as Profile,
        roles: result.session.roles as AppRole[],
        error: null,
      };
    } else {
      return {
        success: false,
        user: null,
        profile: null,
        roles: [],
        error: new Error('Invalid credentials or no cached session. Please connect to the internet to sign in.'),
      };
    }
  } catch (offlineError) {
    console.error('[OfflineAuth] Offline login error:', offlineError);
    return {
      success: false,
      user: null,
      profile: null,
      roles: [],
      error: new Error('Unable to verify credentials offline. Please connect to the internet.'),
    };
  }
}

export async function syncOfflineToOnline(
  email: string,
  password: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!navigator.onLine) {
    return { success: false, error: new Error('Not online') };
  }
  
  console.log('[OfflineAuth] Syncing offline session');
  
  try {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user && data.session) {
      console.log('[OfflineAuth] Offline session synced successfully');
      return { success: true, error: null };
    }
    
    return { success: false, error: error as Error | null };
  } catch (syncError) {
    console.error('[OfflineAuth] Sync error:', syncError);
    return { success: false, error: syncError as Error };
  }
}
