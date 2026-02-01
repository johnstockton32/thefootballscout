// Profile management service
// Handles all profile-related API calls

import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  photo_url: string | null;
  subscription_tier: 'free' | 'pro';
  trial_ends_at: string | null;
  subscription_started_at: string | null;
}

export interface ProfileUpdate {
  full_name?: string | null;
  organization?: string | null;
  photo_url?: string | null;
}

export type AppRole = 'scout' | 'admin';

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('[ProfileService] Error fetching profile:', error);
    return null;
  }
  
  return data as Profile;
}

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error) {
    console.error('[ProfileService] Error fetching roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}

export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_super_admin', { _user_id: userId });
  
  if (error) {
    console.error('[ProfileService] Error checking super admin:', error);
    return false;
  }
  
  return data === true;
}

export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  return { error: error as Error | null };
}

export async function updateGdprConsent(
  userId: string,
  consent: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      gdpr_consent: consent,
      gdpr_consent_date: consent ? new Date().toISOString() : null,
    })
    .eq('id', userId);
  
  return { error: error as Error | null };
}

export async function deleteUserAccount(
  accessToken: string
): Promise<{ error: Error | null }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: new Error(result.error || 'Failed to delete account') };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}
