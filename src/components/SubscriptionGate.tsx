import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { Crown, Lock, Zap } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier: SubscriptionTier;
  feature?: keyof ReturnType<typeof useSubscription>['limits'];
  featureName: string;
  featureDescription?: string;
}

const tierHierarchy: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  team: 2,
  agency: 3,
};

const tierLabels: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  agency: 'Agency',
};

export function SubscriptionGate({
  children,
  requiredTier,
  feature,
  featureName,
  featureDescription,
}: SubscriptionGateProps) {
  const { tier, limits, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const currentTierLevel = tierHierarchy[tier] || 0;
  const requiredTierLevel = tierHierarchy[requiredTier] || 0;
  const hasTierAccess = currentTierLevel >= requiredTierLevel;
  
  // Check specific feature if provided
  const hasFeatureAccess = feature ? limits[feature] : true;
  
  const hasAccess = hasTierAccess && hasFeatureAccess;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4 text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{featureName}</h2>
            <p className="text-muted-foreground mb-6">
              {featureDescription || `This feature requires a ${tierLabels[requiredTier]} plan or higher.`}
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm">
                <span className="text-muted-foreground">Your plan:</span>
                <span className="font-medium capitalize">{tier}</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary">
                <Crown className="w-3.5 h-3.5" />
                <span className="font-medium">{tierLabels[requiredTier]}+</span>
              </div>
            </div>

            <Button variant="hero" asChild className="w-full">
              <Link to="/settings?tab=subscription">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to {tierLabels[requiredTier]}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
