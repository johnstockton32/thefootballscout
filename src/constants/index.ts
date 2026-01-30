// Central export for all constants
export * from './subscription';
export * from './positions';

// App-wide configuration constants
export const APP_CONFIG = {
  name: 'The Football Scout',
  version: '1.0.0',
  offlineSyncIntervalMs: 30000, // 30 seconds
  sessionCacheDays: 30,
  defaultPageSize: 20,
} as const;

// API configuration
export const API_CONFIG = {
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
} as const;

// Storage keys for localStorage/IndexedDB
export const STORAGE_KEYS = {
  authToken: 'sb-uhzrwimvyjwhzhgybgsu-auth-token',
  swipeHintDismissed: 'swipe-hint-dismissed',
  onboardingCompleted: 'onboarding-completed',
  theme: 'theme',
} as const;
