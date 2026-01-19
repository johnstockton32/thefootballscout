import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, ArrowRight, Zap, Users, Building2, Loader2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: '0',
    annualPrice: '0',
    period: 'forever',
    icon: Zap,
    features: [
      'Up to 10 player profiles',
      '5 scouting reports per month',
      'Basic analytics',
      'Player comparison (2 players)',
      'Dark/Light mode',
      'Offline support',
      'Email support',
    ],
    cta: 'Get Started Free',
    variant: 'outline' as const,
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For serious scouts',
    monthlyPrice: '10',
    annualPrice: '8',
    period: 'month',
    icon: Users,
    features: [
      'Unlimited player profiles',
      'Unlimited scouting reports',
      'Advanced analytics & radar charts',
      'Player comparison (up to 5)',
      'Smart Discovery AI search',
      'Bulk CSV import/export',
      'Voice-to-text notes',
      'PDF export',
      'Priority support',
      'Custom attribute weights',
      'AI-powered insights',
    ],
    cta: 'Start Pro Trial',
    variant: 'hero' as const,
    popular: true,
  },
  {
    name: 'Team',
    description: 'For scouting organizations',
    monthlyPrice: '99',
    annualPrice: '79',
    period: 'month',
    icon: Building2,
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Shared player database',
      'Team analytics dashboard',
      'Team activity feed',
      'Push notifications',
      'Video clip attachments',
      'White-label reports',
      'Priority support 24/7',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    variant: 'glass' as const,
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const { user } = useAuth();
  const subscription = useSubscription();

  // Handle subscription cancelled message
  useEffect(() => {
    if (searchParams.get('subscription') === 'cancelled') {
      toast.info('Checkout was cancelled. You can try again anytime.');
    }
  }, [searchParams]);

  const handlePlanAction = async (planName: string) => {
    const tierName = planName.toLowerCase();
    
    // Free plan - just redirect to signup
    if (tierName === 'free') {
      navigate('/auth?mode=signUp&tier=free');
      return;
    }

    // If not logged in, redirect to auth with tier
    if (!user) {
      navigate(`/auth?mode=signUp&tier=${tierName}`);
      return;
    }

    // If already on this tier
    if (subscription.tier === tierName) {
      toast.info(`You're already on the ${planName} plan.`);
      return;
    }

    // Start checkout process
    setIsCheckingOut(tierName);
    try {
      await subscription.createCheckout(tierName as 'pro' | 'team');
    } finally {
      setIsCheckingOut(null);
    }
  };

  const getButtonText = (planName: string, cta: string) => {
    const tierName = planName.toLowerCase();
    
    if (isCheckingOut === tierName) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      );
    }

    if (user && subscription.tier === tierName) {
      return 'Current Plan';
    }

    if (user && tierName !== 'free') {
      if (subscription.tier === 'free') {
        return `Subscribe to ${planName}`;
      }
      // Upgrade or downgrade
      const tierOrder = { free: 0, pro: 1, team: 2 };
      const currentOrder = tierOrder[subscription.tier as keyof typeof tierOrder] || 0;
      const targetOrder = tierOrder[tierName as keyof typeof tierOrder] || 0;
      
      if (targetOrder > currentOrder) {
        return `Upgrade to ${planName}`;
      }
      return `Downgrade to ${planName}`;
    }

    return (
      <>
        {cta}
        <ArrowRight className="w-4 h-4" />
      </>
    );
  };
  return (
    <div className="min-h-screen bg-background pitch-pattern">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="cursor-pointer">
            <Logo size="sm" showText={false} className="sm:hidden" />
            <Logo size="sm" className="hidden sm:flex" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/install')}>
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate('/auth')}>
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Simple, Transparent</span>
            <br />
            <span className="text-gradient-pitch">Pricing</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your scouting needs. Start free and upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const period = plan.period === 'forever' ? 'forever' : isAnnual ? 'month (billed annually)' : 'month';
              
              return (
                <Card 
                  key={plan.name} 
                  className={`relative card-glass border-border/50 hover:border-primary/30 transition-all duration-300 ${
                    plan.popular ? 'ring-2 ring-primary scale-105 md:scale-110' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <span className="text-5xl font-bold">£{price}</span>
                      <span className="text-muted-foreground">/{period}</span>
                    </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.variant} 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePlanAction(plan.name)}
                    disabled={isCheckingOut !== null || (user && subscription.tier === plan.name.toLowerCase())}
                  >
                    {getButtonText(plan.name, plan.cta)}
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="card-glass p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="card-glass p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Is there a free trial for Pro?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, Pro comes with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="card-glass p-6 rounded-xl">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for Team plans.
              </p>
            </div>
            <div className="card-glass p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely. Cancel anytime with no questions asked. Your data remains accessible until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to scout smarter?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start with our free plan and upgrade when you need more.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText={false} />
          <p className="text-sm text-muted-foreground">
            © 2026 The Football Scout. GDPR Compliant.
          </p>
        </div>
      </footer>
    </div>
  );
}