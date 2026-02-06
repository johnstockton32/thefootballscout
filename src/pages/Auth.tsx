import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Shield, User, Mail, Lock, ArrowLeft, Crown, Users, Sparkles, Check, Tag, CheckCircle, XCircle, Loader2, WifiOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  organization: z.string().optional(),
  promoCode: z.string().max(50, 'Promo code is too long').optional(),
});

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthMode = 'signIn' | 'signUp' | 'resetPassword';
type SubscriptionTier = 'free' | 'pro';

const tierOptions: { tier: SubscriptionTier; label: string; icon: typeof Crown; description: string; price: string; features: string[] }[] = [
  {
    tier: 'free',
    label: 'Free',
    icon: Sparkles,
    description: 'Get started with basic scouting',
    price: '£0/month',
    features: ['Up to 10 players', '5 reports/month', '2-player comparison'],
  },
  {
    tier: 'pro',
    label: 'Pro',
    icon: Crown,
    description: '14-day free trial included',
    price: '£10/month',
    features: ['Unlimited players', 'Unlimited reports', '5-player comparison'],
  },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, updateGdprConsent } = useAuth();
  const { isOnline } = useOfflineStatus();
  
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  
  const [promoCode, setPromoCode] = useState('');
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [promoCodeStatus, setPromoCodeStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [promoCodeMessage, setPromoCodeMessage] = useState<string>('');
  const [promoCodeBenefits, setPromoCodeBenefits] = useState<{ tierUpgrade?: string; discountPercent?: number } | null>(null);

  // Check for mode and tier from URL params (from pricing page)
  useEffect(() => {
    const modeParam = searchParams.get('mode') as AuthMode | null;
    const tierParam = searchParams.get('tier') as SubscriptionTier | null;
    
    if (modeParam && ['signIn', 'signUp', 'resetPassword'].includes(modeParam)) {
      setMode(modeParam);
    }
    
    if (tierParam && ['free', 'pro'].includes(tierParam)) {
      setSelectedTier(tierParam as SubscriptionTier);
      setMode('signUp');
    }
  }, [searchParams]);

  // Validate promo code with debounce
  useEffect(() => {
    if (!promoCode.trim()) {
      setPromoCodeStatus('idle');
      setPromoCodeMessage('');
      setPromoCodeBenefits(null);
      return;
    }

    const validateCode = async () => {
      setPromoCodeStatus('validating');
      try {
        const { data, error } = await supabase.rpc('validate_promo_code', { _code: promoCode.trim() });
        
        if (error) {
          setPromoCodeStatus('invalid');
          setPromoCodeMessage('Error validating code');
          setPromoCodeBenefits(null);
          return;
        }

        const result = data as { valid: boolean; error?: string; description?: string; tier_upgrade?: string; discount_percent?: number };
        
        if (result.valid) {
          setPromoCodeStatus('valid');
          setPromoCodeMessage(result.description || 'Code applied!');
          setPromoCodeBenefits({
            tierUpgrade: result.tier_upgrade,
            discountPercent: result.discount_percent,
          });
        } else {
          setPromoCodeStatus('invalid');
          setPromoCodeMessage(result.error || 'Invalid code');
          setPromoCodeBenefits(null);
        }
      } catch (err) {
        setPromoCodeStatus('invalid');
        setPromoCodeMessage('Error validating code');
        setPromoCodeBenefits(null);
      }
    };

    const timeout = setTimeout(validateCode, 500);
    return () => clearTimeout(timeout);
  }, [promoCode]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (mode === 'resetPassword') {
        resetSchema.parse({ email });
      } else {
        authSchema.parse({ 
          email, 
          password, 
          fullName: mode === 'signUp' ? fullName : undefined,
          organization: mode === 'signUp' ? organization : undefined,
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Password reset email sent! Check your inbox.');
      setMode('signIn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For signup and password reset, require online
    if (!isOnline && mode !== 'signIn') {
      toast.error('You need to be online to ' + (mode === 'signUp' ? 'create an account' : 'reset your password') + '.');
      return;
    }
    
    if (mode === 'resetPassword') {
      await handlePasswordReset();
      return;
    }
    
    if (!validateForm()) return;
    
    if (mode === 'signUp' && !gdprConsent) {
      toast.error('Please accept the data processing agreement to continue');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      if (mode === 'signUp') {

        const { error } = await signUp(email, password, fullName, organization, promoCode.trim() || undefined);
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            setFormError('An account with this email already exists. Please use a different email address or sign in to your existing account.');
          } else {
            setFormError(error.message);
            toast.error(error.message);
          }
          return;
        }
        
        // Update GDPR consent after signup
        await updateGdprConsent(true);
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        const accessToken = sessionData.session?.access_token;
        
        if (currentUser) {
          // Redeem promo code if valid
          let promoAppliedTier: string | null = null;
          if (promoCode.trim() && promoCodeStatus === 'valid') {
            const { data: redeemResult } = await supabase.rpc('redeem_promo_code', { 
              _user_id: currentUser.id, 
              _code: promoCode.trim() 
            });
            
            const result = redeemResult as { success: boolean; tier_upgrade?: string; error?: string } | null;
            if (result?.success && result.tier_upgrade) {
              promoAppliedTier = result.tier_upgrade;
              toast.success(`Welcome! Your ${promoAppliedTier.charAt(0).toUpperCase() + promoAppliedTier.slice(1)} access has been activated!`);
              navigate('/dashboard');
              return;
            }
          }

          // For paid tiers, redirect to Stripe checkout (payment required first)
          if (!promoAppliedTier && selectedTier === 'pro') {
            try {
              toast.success('Account created! Redirecting to payment...');
              
              // Create Stripe checkout session
              const { data, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
                body: { tier: selectedTier, isAnnual: false },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (checkoutError) {
                console.error('Checkout error:', checkoutError);
                toast.error('Account created but payment setup failed. Please upgrade from your dashboard.');
                navigate('/dashboard');
                return;
              }

              if (data?.url) {
                // Redirect to Stripe checkout in same window
                window.location.href = data.url;
                return;
              } else {
                toast.error('Account created but payment setup failed. Please upgrade from your dashboard.');
                navigate('/dashboard');
                return;
              }
            } catch (checkoutErr) {
              console.error('Checkout error:', checkoutErr);
              toast.error('Account created but payment setup failed. Please upgrade from your dashboard.');
              navigate('/dashboard');
              return;
            }
          }
          
          // Free tier - just go to dashboard
          toast.success('Welcome to The Football Scout!');
        }
        navigate('/dashboard');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signUp': return 'Create your account';
      case 'resetPassword': return 'Reset your password';
      default: return 'Welcome back';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'signUp': return 'Start scouting the next generation of talent';
      case 'resetPassword': return 'Enter your email and we\'ll send you a reset link';
      default: return 'Sign in to access your scouting dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-background pitch-pattern flex flex-col">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>
            {mode === 'signIn' 
              ? "You're offline. You can sign in with previously cached credentials."
              : "You're offline. Please connect to the internet to continue."}
          </span>
        </div>
      )}
      
      {/* Header */}
      <header className="p-3 sm:p-4 md:p-6 flex items-center gap-3 sm:gap-4 safe-area-top">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="gap-2 px-2 sm:px-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <Logo size="sm" />
      </header>

      {/* Main content - scrollable on mobile */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 pb-8 safe-area-bottom">
        <div className="w-full max-w-md mx-auto animate-fade-in">
          <Card className="card-glass border-border/50">
            <CardHeader className="text-center pb-2 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {getTitle()}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">
                {getDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Form Error Banner */}
              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{formError}</p>
                    {formError.includes('already exists') && (
                      <button
                        type="button"
                        onClick={() => { setMode('signIn'); setFormError(null); }}
                        className="underline hover:no-underline mt-1 text-sm"
                      >
                        Sign in instead →
                      </button>
                    )}
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signUp' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Smith"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-input border-border focus:border-primary"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-input border-border focus:border-primary"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {mode !== 'resetPassword' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      {mode === 'signIn' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('resetPassword');
                            setErrors({});
                            setFormError(null);
                          }}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-input border-border focus:border-primary"
                        autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'signUp' && password && (
                      <PasswordStrengthIndicator password={password} />
                    )}
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}

                {mode === 'signUp' && (
                  <>
                    {/* Tier Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Choose your plan</Label>
                      <div className="grid gap-1.5">
                        {tierOptions.map((option) => (
                          <button
                            key={option.tier}
                            type="button"
                            onClick={() => setSelectedTier(option.tier)}
                            className={cn(
                              'flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all',
                              selectedTier === option.tier
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                              selectedTier === option.tier ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                              <option.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.price}</span>
                                {option.tier === 'pro' && (
                                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                                    14-day trial
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">{option.description}</p>
                            </div>
                            {selectedTier === option.tier && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Promo Code Field */}
                    <div className="space-y-2">
                      {!showPromoCode ? (
                        <button
                          type="button"
                          onClick={() => setShowPromoCode(true)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          Have a promo code?
                        </button>
                      ) : (
                        <>
                          <Label htmlFor="promoCode" className="text-sm font-medium">
                            Promo Code
                          </Label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="promoCode"
                              type="text"
                              placeholder="Enter promo code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className={cn(
                                "pl-10 pr-10 bg-input border-border focus:border-primary uppercase",
                                promoCodeStatus === 'valid' && "border-green-500 focus:border-green-500",
                                promoCodeStatus === 'invalid' && "border-destructive focus:border-destructive"
                              )}
                              maxLength={50}
                            />
                            {promoCodeStatus === 'validating' && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                            )}
                            {promoCodeStatus === 'valid' && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                            {promoCodeStatus === 'invalid' && (
                              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                            )}
                          </div>
                          {promoCodeMessage && (
                            <p className={cn(
                              "text-xs",
                              promoCodeStatus === 'valid' ? "text-green-500" : "text-destructive"
                            )}>
                              {promoCodeMessage}
                            </p>
                          )}
                          {promoCodeBenefits && promoCodeStatus === 'valid' && (
                            <div className="text-xs p-2 bg-green-500/10 border border-green-500/20 rounded-md space-y-1">
                              {promoCodeBenefits.tierUpgrade && (
                                <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  Includes {promoCodeBenefits.tierUpgrade.charAt(0).toUpperCase() + promoCodeBenefits.tierUpgrade.slice(1)} tier upgrade!
                                </p>
                              )}
                              {promoCodeBenefits.discountPercent && promoCodeBenefits.discountPercent > 0 && (
                                <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {promoCodeBenefits.discountPercent}% discount applied!
                                </p>
                              )}
                            </div>
                          )}
                          {errors.promoCode && (
                            <p className="text-xs text-destructive">{errors.promoCode}</p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-start space-x-3 py-2">
                      <Checkbox
                        id="gdpr"
                        checked={gdprConsent}
                        onCheckedChange={(checked) => setGdprConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="gdpr" className="text-sm font-medium leading-tight cursor-pointer">
                          I agree to data processing
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          I consent to the processing of my personal data in accordance with GDPR. 
                          Player data will be handled securely and in compliance with data protection regulations.
                          Read our{' '}
                          <a 
                            href="/privacy-policy" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Privacy Policy
                          </a>
                          {' '}and{' '}
                          <a 
                            href="/terms-of-service" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Terms of Service
                          </a>.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      {mode === 'signUp' && 'Create Account'}
                      {mode === 'signIn' && 'Sign In'}
                      {mode === 'resetPassword' && 'Send Reset Link'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {mode === 'resetPassword' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signIn');
                      setErrors({});
                      setFormError(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signUp' ? 'signIn' : 'signUp');
                      setErrors({});
                      setFormError(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mode === 'signUp' ? (
                      <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
                    ) : (
                      <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GDPR Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>GDPR Compliant • Data stored securely in EU</span>
          </div>
        </div>
      </main>
    </div>
  );
}
