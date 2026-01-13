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
import { Eye, EyeOff, ArrowRight, Shield, User, Mail, Lock, ArrowLeft, Crown, Users, Sparkles, Check } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  teamName: z.string().optional(),
});

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthMode = 'signIn' | 'signUp' | 'resetPassword';
type SubscriptionTier = 'free' | 'pro' | 'team';

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
    price: '£29/month',
    features: ['Unlimited players', 'Unlimited reports', '5-player comparison'],
  },
  {
    tier: 'team',
    label: 'Team',
    icon: Users,
    description: 'For professional scouting teams',
    price: '£99/month',
    features: ['Everything in Pro', 'Team collaboration', 'Priority support'],
  },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, updateGdprConsent } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');

  // Check for mode and tier from URL params (from pricing page)
  useEffect(() => {
    const modeParam = searchParams.get('mode') as AuthMode | null;
    const tierParam = searchParams.get('tier') as SubscriptionTier | null;
    
    if (modeParam && ['signIn', 'signUp', 'resetPassword'].includes(modeParam)) {
      setMode(modeParam);
    }
    
    if (tierParam && ['free', 'pro', 'team'].includes(tierParam)) {
      setSelectedTier(tierParam);
      setMode('signUp');
    }
  }, [searchParams]);

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
          teamName: mode === 'signUp' && selectedTier === 'team' ? teamName : undefined,
        });
        
        // Additional validation for team signup
        if (mode === 'signUp' && selectedTier === 'team' && !teamName.trim()) {
          setErrors({ teamName: 'Team name is required' });
          return false;
        }
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

    try {
      if (mode === 'signUp') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        // Update GDPR consent after signup
        await updateGdprConsent(true);
        
        // Apply selected tier after a brief delay to ensure profile exists
        // We need to get the user from the current session
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        
        if (currentUser && selectedTier !== 'free') {
          if (selectedTier === 'pro') {
            await supabase.rpc('start_pro_trial', { _user_id: currentUser.id });
          } else if (selectedTier === 'team') {
            await supabase.rpc('upgrade_subscription', { _user_id: currentUser.id, _tier: 'team' });
            
            // Create the team with the user as owner
            const { data: newTeam, error: teamError } = await supabase
              .from('teams')
              .insert({
                name: teamName.trim(),
                owner_id: currentUser.id,
              })
              .select()
              .single();
            
            if (!teamError && newTeam) {
              // Update the user's profile with the team_id and set them as team_admin
              await supabase
                .from('profiles')
                .update({ 
                  team_id: newTeam.id,
                  team_role: 'team_admin' as const
                })
                .eq('id', currentUser.id);
            }
          }
        }
        
        toast.success(`Welcome to The Football Scout! ${selectedTier === 'pro' ? 'Your 14-day Pro trial has started.' : ''}`);
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
      {/* Header */}
      <header className="p-4 md:p-6">
        <Logo size="md" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="card-glass border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {getTitle()}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {getDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signUp' && (
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
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}

                {mode === 'signUp' && (
                  <>
                    {/* Tier Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Choose your plan</Label>
                      <div className="grid gap-2">
                        {tierOptions.map((option) => (
                          <button
                            key={option.tier}
                            type="button"
                            onClick={() => setSelectedTier(option.tier)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                              selectedTier === option.tier
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              selectedTier === option.tier ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                              <option.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.price}</span>
                                {option.tier === 'pro' && (
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    14-day trial
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                            </div>
                            {selectedTier === option.tier && (
                              <Check className="w-5 h-5 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Team Name Field - Only for Team tier */}
                    {selectedTier === 'team' && (
                      <div className="space-y-2">
                        <Label htmlFor="teamName" className="text-sm font-medium">
                          Team Name
                        </Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="teamName"
                            type="text"
                            placeholder="Your Scouting Organization"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="pl-10 bg-input border-border focus:border-primary"
                          />
                        </div>
                        {errors.teamName && (
                          <p className="text-xs text-destructive">{errors.teamName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          You'll be the admin of this team and can invite other scouts.
                        </p>
                      </div>
                    )}

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
