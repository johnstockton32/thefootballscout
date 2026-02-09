import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchUserProfile, 
  fetchUserRoles, 
  checkIsSuperAdmin,
  updateUserProfile as updateProfileService,
  updateGdprConsent as updateGdprService,
  deleteUserAccount,
  type Profile,
  type ProfileUpdate,
  type AppRole,
} from '@/services/auth/profileService';
import {
  attemptOnlineLogin,
  attemptOfflineLogin,
  syncOfflineToOnline,
} from '@/services/auth/offlineAuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOfflineMode: boolean;
  signUp: (email: string, password: string, fullName?: string, organization?: string, promoCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateGdprConsent: (consent: boolean) => Promise<{ error: Error | null }>;
  updateProfile: (data: ProfileUpdate) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  syncOfflineSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileData, userRoles, superAdminStatus] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserRoles(userId),
      checkIsSuperAdmin(userId),
    ]);
    
    if (profileData) setProfile(profileData);
    setRoles(userRoles);
    setIsSuperAdmin(superAdminStatus);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer to avoid auth state deadlock
          setTimeout(() => loadUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsSuperAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signUp = async (email: string, password: string, fullName?: string, organization?: string, promoCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          organization: organization,
          promo_code: promoCode?.trim() || null,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      const result = await attemptOnlineLogin(email, password);
      if (!result.error) {
        setIsOfflineMode(false);
      }
      return { error: result.error };
    } else {
      const result = await attemptOfflineLogin(email, password);
      
      if (result.success) {
        setUser(result.user);
        setProfile(result.profile);
        setRoles(result.roles);
        setIsOfflineMode(true);
        setPendingCredentials({ email, password });
        return { error: null };
      }
      
      return { error: result.error };
    }
  };

  const syncOfflineSession = useCallback(async () => {
    if (!isOfflineMode || !pendingCredentials) return;
    if (!navigator.onLine) return;
    
    const result = await syncOfflineToOnline(
      pendingCredentials.email,
      pendingCredentials.password
    );
    
    if (result.success) {
      setIsOfflineMode(false);
      setPendingCredentials(null);
      
      // Refresh session data
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await loadUserData(session.user.id);
      }
    }
  }, [isOfflineMode, pendingCredentials, loadUserData]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Auth] Device came online, attempting sync');
      syncOfflineSession();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineSession]);

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsSuperAdmin(false);
      setRoles([]);
      setIsOfflineMode(false);
      setPendingCredentials(null);
      
      if (navigator.onLine) {
        await supabase.auth.signOut({ scope: 'global' });
      }
      
      localStorage.removeItem('sb-uhzrwimvyjwhzhgybgsu-auth-token');
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.href = '/auth';
    }
  };

  const updateGdprConsent = async (consent: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const result = await updateGdprService(user.id, consent);
    
    if (!result.error && profile) {
      setProfile({
        ...profile,
        gdpr_consent: consent,
        gdpr_consent_date: consent ? new Date().toISOString() : null,
      });
    }
    
    return result;
  };

  const updateProfile = async (data: ProfileUpdate) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const result = await updateProfileService(user.id, data);
    
    if (!result.error && profile) {
      setProfile({ ...profile, ...data });
    }
    
    return result;
  };

  const deleteAccount = async () => {
    if (!user || !session) return { error: new Error('Not authenticated') };
    
    const result = await deleteUserAccount(session.access_token);
    
    if (!result.error) {
      // Clear all local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsSuperAdmin(false);
      setRoles([]);
      
      // Sign out globally to clear all sessions
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch {
        // Auth user is already deleted, signOut may fail — that's fine
      }
      
      // Clear any localStorage tokens
      localStorage.removeItem('pending_pro_signup');
      localStorage.removeItem('pending_promo_code');
    }
    
    return result;
  };

  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isOfflineMode,
        signUp,
        signIn,
        signOut,
        updateGdprConsent,
        updateProfile,
        deleteAccount,
        syncOfflineSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export types for convenience
export type { Profile, ProfileUpdate, AppRole };
