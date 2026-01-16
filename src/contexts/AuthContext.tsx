import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  photo_url: string | null;
  team_id: string | null;
  team_role: 'scout' | 'senior_scout' | 'team_admin' | null;
  subscription_tier: 'free' | 'pro' | 'team';
}

interface ProfileUpdate {
  full_name?: string | null;
  organization?: string | null;
  photo_url?: string | null;
  team_id?: string | null;
  team_role?: 'scout' | 'senior_scout' | 'team_admin' | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName?: string, organization?: string, promoCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateGdprConsent: (consent: boolean) => Promise<{ error: Error | null }>;
  updateProfile: (data: ProfileUpdate) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data as Profile);
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  const checkSuperAdmin = async (userId: string) => {
    const { data } = await supabase.rpc('is_super_admin', { _user_id: userId });
    setIsSuperAdmin(data === true);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/roles fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
            checkSuperAdmin(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsSuperAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
        checkSuperAdmin(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      // Clear all local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsSuperAdmin(false);
      setRoles([]);
      
      // Sign out from Supabase (clears all sessions including other tabs)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Clear any cached data from localStorage
      localStorage.removeItem('sb-uhzrwimvyjwhzhgybgsu-auth-token');
      
      // Clear React Query cache if present
      if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
        // Clear any cached queries
      }
      
      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force redirect even on error to ensure user is logged out
      window.location.href = '/auth';
    }
  };

  const updateGdprConsent = async (consent: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update({
        gdpr_consent: consent,
        gdpr_consent_date: consent ? new Date().toISOString() : null,
      })
      .eq('id', user.id);
    
    if (!error && profile) {
      setProfile({
        ...profile,
        gdpr_consent: consent,
        gdpr_consent_date: consent ? new Date().toISOString() : null,
      });
    }
    
    return { error: error as Error | null };
  };

  const updateProfile = async (data: ProfileUpdate) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    
    if (!error && profile) {
      setProfile({
        ...profile,
        ...data,
      });
    }
    
    return { error: error as Error | null };
  };

  const deleteAccount = async () => {
    if (!user || !session) return { error: new Error('Not authenticated') };
    
    try {
      // Use edge function for secure server-side deletion
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { error: new Error(result.error || 'Failed to delete account') };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsSuperAdmin(false);
      setRoles([]);
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
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
        signUp,
        signIn,
        signOut,
        updateGdprConsent,
        updateProfile,
        deleteAccount,
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
