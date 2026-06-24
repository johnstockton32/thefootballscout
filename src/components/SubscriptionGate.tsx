import { ReactNode } from 'react';
import type { SubscriptionTier } from '@/constants/subscription';
import type { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier?: SubscriptionTier;
  feature?: keyof ReturnType<typeof useSubscription>['limits'];
  featureName?: string;
  featureDescription?: string;
}

// Single-user mode: all features unlocked.
export function SubscriptionGate({ children }: SubscriptionGateProps) {
  return <>{children}</>;
}
