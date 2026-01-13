/**
 * Maps database/API errors to user-friendly messages
 * This prevents leaking internal system details to users
 */
export function mapErrorToUserMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // PostgreSQL error codes
    if (message.includes('23505') || message.includes('unique_violation') || message.includes('duplicate')) {
      return 'This record already exists.';
    }
    
    if (message.includes('23503') || message.includes('foreign_key_violation')) {
      return 'Cannot complete this action due to related records.';
    }
    
    if (message.includes('23502') || message.includes('not_null_violation')) {
      return 'Required information is missing.';
    }
    
    if (message.includes('23514') || message.includes('check_violation')) {
      return 'The provided data is invalid.';
    }
    
    // RLS/Auth errors
    if (message.includes('row-level security') || message.includes('rls')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (message.includes('jwt') || message.includes('token')) {
      return 'Your session has expired. Please sign in again.';
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Please sign in to continue.';
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
  }

  // Handle objects with code property (Supabase/PostgreSQL errors)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const err = error as { code: string };
    switch (err.code) {
      case '23505':
        return 'This record already exists.';
      case '23503':
        return 'Cannot complete this action due to related records.';
      case '23502':
        return 'Required information is missing.';
      case '23514':
        return 'The provided data is invalid.';
      case 'PGRST301':
        return 'You do not have permission to perform this action.';
      case 'PGRST116':
        return 'The requested record was not found.';
      default:
        break;
    }
  }

  // Default message
  return 'An error occurred. Please try again.';
}

/**
 * Logs error details for debugging while returning safe message
 */
export function handleError(error: unknown, context?: string): string {
  // Log full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }
  
  return mapErrorToUserMessage(error);
}
