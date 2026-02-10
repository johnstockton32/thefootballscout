/**
 * OAuth helper utilities for handling authentication across different domains.
 * 
 * The Lovable Cloud OAuth endpoint (~oauth/initiate) only works on *.lovable.app domains.
 * When the app is accessed via a custom domain, we redirect to the lovable.app domain
 * to initiate OAuth, then the user is redirected back after authentication.
 */

const LOVABLE_APP_URL = "https://thefootballscout.lovable.app";

/**
 * Check if the current page is running on a custom domain (not lovable.app/lovableproject.com/localhost)
 */
export function isCustomDomain(): boolean {
  const origin = window.location.origin;
  return (
    !origin.includes('lovable.app') &&
    !origin.includes('lovableproject.com') &&
    !origin.includes('localhost')
  );
}

/**
 * Get the redirect URI for OAuth. Always use the lovable.app domain
 * since OAuth callbacks need to go through that domain.
 */
export function getOAuthRedirectUri(): string {
  return LOVABLE_APP_URL;
}

/**
 * Build a URL to redirect the user to the lovable.app auth page
 * with params to auto-trigger OAuth on arrival.
 */
export function buildOAuthRedirectUrl(
  provider: 'google' | 'apple',
  mode: string
): string {
  const params = new URLSearchParams({ mode, provider });
  return `${LOVABLE_APP_URL}/auth?${params.toString()}`;
}
