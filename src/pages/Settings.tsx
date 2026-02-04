import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Lock, Trash2, LogOut, FileText, Users, Palette, Sun, Moon, Monitor, Crown, Zap, Building2, Briefcase, Check, ArrowLeft, Mail, Loader2, Sliders, PlayCircle, CreditCard, ExternalLink } from 'lucide-react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { exportPlayersCSV, exportReportsCSV } from '@/lib/export';
import { handleError } from '@/lib/errorUtils';
import { ProfilePhotoUpload } from '@/components/settings/ProfilePhotoUpload';
import { CustomAttributeWeights } from '@/components/settings/CustomAttributeWeights';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { format, formatDistanceToNow } from 'date-fns';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
  organization: z.string().trim().max(200, 'Organization must be less than 200 characters').optional(),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Password must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// RestartTourButton component
function RestartTourButton() {
  const navigate = useNavigate();
  const { resetTour } = useOnboardingTour();
  const { toast } = useToast();

  const handleRestartTour = () => {
    resetTour();
    toast({
      title: 'Tour reset',
      description: 'Redirecting to dashboard to start the tour...',
    });
    navigate('/dashboard');
  };

  return (
    <Button variant="outline" onClick={handleRestartTour} className="gap-2">
      <PlayCircle className="h-4 w-4" />
      Restart Onboarding Tour
    </Button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, updateGdprConsent, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const subscription = useSubscription();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingPlayers, setIsExportingPlayers] = useState(false);
  const [isExportingReports, setIsExportingReports] = useState(false);
  const [isWithdrawingConsent, setIsWithdrawingConsent] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      organization: profile?.organization || '',
    },
  });

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Reset form when profile data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name || '',
        organization: profile.organization || '',
      });
    }
  }, [profile, profileForm]);

  // Reset email form when user data loads
  useEffect(() => {
    if (user?.email) {
      emailForm.reset({ email: user.email });
    }
  }, [user?.email, emailForm]);

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const { error } = await updateProfile({
        full_name: data.full_name || null,
        organization: data.organization || null,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'updating profile'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle email change
  const onEmailSubmit = async (data: EmailFormData) => {
    if (data.email === user?.email) {
      toast({
        title: 'No change',
        description: 'The email address is the same as your current email.',
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      // Check if email is already in use by another user
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .neq('id', user?.id || '')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingProfile) {
        toast({
          title: 'Email already in use',
          description: 'This email address is already registered to another account.',
          variant: 'destructive',
        });
        return;
      }

      // Update email in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });
      
      if (error) throw error;
      
      setShowEmailForm(false);
      toast({
        title: 'Verification email sent',
        description: 'Please check your new email address to confirm the change.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'changing email'),
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });
      
      if (signInError) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive',
        });
        return;
      }
      
      // Now update to new password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (error) throw error;
      
      passwordForm.reset();
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'changing password'),
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle export players
  const handleExportPlayers = async () => {
    setIsExportingPlayers(true);
    try {
      await exportPlayersCSV();
      toast({
        title: 'Export complete',
        description: 'Your players have been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'exporting players'),
        variant: 'destructive',
      });
    } finally {
      setIsExportingPlayers(false);
    }
  };

  // Handle export reports
  const handleExportReports = async () => {
    setIsExportingReports(true);
    try {
      await exportReportsCSV();
      toast({
        title: 'Export complete',
        description: 'Your reports have been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'exporting reports'),
        variant: 'destructive',
      });
    } finally {
      setIsExportingReports(false);
    }
  };

  // Handle GDPR consent withdrawal
  const handleWithdrawConsent = async () => {
    setIsWithdrawingConsent(true);
    try {
      const { error } = await updateGdprConsent(false);
      if (error) throw error;
      
      toast({
        title: 'Consent withdrawn',
        description: 'Your GDPR consent has been withdrawn. Some features may be limited.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'withdrawing consent'),
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawingConsent(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeletingAccount(true);
    try {
      const { error } = await deleteAccount();
      if (error) throw error;
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'deleting account'),
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Handle start trial
  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const success = await subscription.startTrial();
      if (success) {
        toast({
          title: 'Trial started!',
          description: 'Your 14-day Pro trial has begun. Enjoy unlimited access!',
        });
      } else {
        toast({
          title: 'Unable to start trial',
          description: 'You may have already used your trial period.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'starting trial'),
        variant: 'destructive',
      });
    } finally {
      setIsStartingTrial(false);
    }
  };

  // Handle upgrade
  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsUpgrading(true);
    try {
      const success = await subscription.upgradePlan(tier);
      if (success) {
        toast({
          title: 'Plan upgraded!',
          description: `You're now on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'upgrading plan'),
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const success = await subscription.cancelSubscription();
      if (success) {
        toast({
          title: 'Subscription cancelled',
          description: 'You have been downgraded to the Free plan.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: handleError(error, 'cancelling subscription'),
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return <Zap className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'bg-muted text-muted-foreground';
      case 'pro': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <TabsList className="inline-flex w-max lg:w-auto min-w-full lg:min-w-0">
              <TabsTrigger value="profile" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <User className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Crown className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="scouting" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Sliders className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Scouting</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Palette className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Lock className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Security</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Shield className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-1.5 px-2.5 sm:px-3 shrink-0">
                <Trash2 className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Account</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Photo */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Upload a photo to personalize your account</CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <ProfilePhotoUpload
                    userId={user.id}
                    currentPhotoUrl={profile?.photo_url || null}
                    fullName={profile?.full_name || null}
                    onPhotoUpdated={(url) => {
                      updateProfile({ photo_url: url });
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email</Label>
                        {!showEmailForm && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmailForm(true)}
                            className="text-xs h-auto py-1"
                          >
                            Change Email
                          </Button>
                        )}
                      </div>
                      {!showEmailForm ? (
                        <Input value={user?.email || ''} disabled className="bg-muted" />
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="Enter new email address"
                              className="pl-10"
                              value={emailForm.watch('email')}
                              onChange={(e) => emailForm.setValue('email', e.target.value)}
                            />
                          </div>
                          {emailForm.formState.errors.email && (
                            <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={emailForm.handleSubmit(onEmailSubmit)}
                              disabled={isChangingEmail}
                            >
                              {isChangingEmail ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                'Update Email'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowEmailForm(false);
                                emailForm.reset({ email: user?.email || '' });
                              }}
                              disabled={isChangingEmail}
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            A verification email will be sent to your new email address.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scouting Tab */}
          <TabsContent value="scouting" className="space-y-6">
            <CustomAttributeWeights />
            <BrandingSettings />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card className="card-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                  </div>
                  <Badge className={`${getTierColor(subscription.tier)} px-3 py-1 text-sm`}>
                    {getTierIcon(subscription.tier)}
                    <span className="ml-2 capitalize">{subscription.tier}</span>
                    {subscription.isInTrial && <span className="ml-1">(Trial)</span>}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe Subscription Management */}
                {subscription.isSubscribedViaStripe && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-700 dark:text-green-300">Active Subscription</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {subscription.subscriptionEndsAt && (
                            <>Next billing: {format(subscription.subscriptionEndsAt, 'MMMM d, yyyy')}</>
                          )}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          setIsOpeningPortal(true);
                          try {
                            await subscription.openCustomerPortal();
                          } finally {
                            setIsOpeningPortal(false);
                          }
                        }}
                        disabled={isOpeningPortal}
                        className="gap-2"
                      >
                        {isOpeningPortal ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Manage Billing
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      View invoices, update payment method, upgrade, downgrade, or cancel your subscription.
                    </p>
                  </div>
                )}

                {/* Trial Status */}
                {subscription.isInTrial && subscription.trialEndsAt && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Pro Trial Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your trial ends {formatDistanceToNow(subscription.trialEndsAt, { addSuffix: true })} 
                      ({format(subscription.trialEndsAt, 'MMMM d, yyyy')})
                    </p>
                  </div>
                )}

                {/* Usage Stats */}
                <div className="space-y-4">
                  <h4 className="font-medium">Usage This Month</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Players</span>
                      <span>
                        {subscription.usage.playerCount} / {subscription.limits.maxPlayers === Infinity ? '∞' : subscription.limits.maxPlayers}
                      </span>
                    </div>
                    {subscription.tier === 'free' && (
                      <Progress 
                        value={(subscription.usage.playerCount / subscription.limits.maxPlayers) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Reports this month</span>
                      <span>
                        {subscription.usage.monthlyReportCount} / {subscription.limits.maxReportsPerMonth === Infinity ? '∞' : subscription.limits.maxReportsPerMonth}
                      </span>
                    </div>
                    {subscription.tier === 'free' && (
                      <Progress 
                        value={(subscription.usage.monthlyReportCount / subscription.limits.maxReportsPerMonth) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Plan Features */}
                <div className="space-y-3">
                  <h4 className="font-medium">Your Plan Includes</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {subscription.limits.maxPlayers === Infinity ? 'Unlimited' : `Up to ${subscription.limits.maxPlayers}`} player profiles
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {subscription.limits.maxReportsPerMonth === Infinity ? 'Unlimited' : `${subscription.limits.maxReportsPerMonth}`} reports per month
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Compare up to {subscription.limits.maxComparisonPlayers} players
                    </li>
                    {subscription.limits.hasAdvancedAnalytics && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        Advanced analytics & radar charts
                      </li>
                    )}
                    {subscription.limits.hasPdfExport && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        PDF export
                      </li>
                    )}
                    {subscription.limits.hasAIInsights && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        AI-powered insights
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Options */}
            {subscription.tier === 'free' && (
              <Card className="card-glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Upgrade Your Plan
                  </CardTitle>
                  <CardDescription>Unlock more features with a paid plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upgrade to Pro */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Pro Plan</h4>
                        <span className="text-lg font-bold">£10/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Unlimited players, reports, and advanced features
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade('pro')}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Pro Plan Management */}
            {subscription.tier === 'pro' && !subscription.isInTrial && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle>Plan Management</CardTitle>
                  <CardDescription>Upgrade or modify your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold">Downgrade to Free</h4>
                        <span className="text-lg font-bold">£0/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Basic features with limited players & reports
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          Downgrade
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Downgrade to Free?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will be downgraded to the Free plan. You'll have:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Up to 10 player profiles</li>
                              <li>Up to 5 reports per month</li>
                              <li>Basic analytics</li>
                            </ul>
                            <p className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                              <strong>Important:</strong> You'll retain access to Pro features until the end of your current billing period. After that, you'll lose access to unlimited players, reports, AI insights, and PDF export.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Pro Plan</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUpgrade('free')}
                            disabled={isUpgrading}
                          >
                            {isUpgrading ? 'Processing...' : 'Downgrade to Free'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancel Subscription */}
            {(subscription.tier !== 'free') && (
              <Card className="card-glass border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
                  <CardDescription>
                    Downgrade to the free plan. You'll lose access to premium features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will be downgraded to the Free plan immediately. You'll lose access to:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Unlimited player profiles (limited to 10)</li>
                            <li>Unlimited reports (limited to 5/month)</li>
                            <li>Advanced analytics and PDF export</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all w-full ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center shrink-0">
                      <Sun className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Light</p>
                      <p className="text-sm text-muted-foreground">Bright and clean</p>
                    </div>
                    {theme === 'light' && (
                      <Badge variant="default" className="bg-primary text-primary-foreground shrink-0">Active</Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all w-full ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
                      <Moon className="h-6 w-6 text-slate-300" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Dark</p>
                      <p className="text-sm text-muted-foreground">Stadium night mode</p>
                    </div>
                    {theme === 'dark' && (
                      <Badge variant="default" className="bg-primary text-primary-foreground shrink-0">Active</Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all w-full ${
                      theme === 'system' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">System</p>
                      <p className="text-sm text-muted-foreground">Match device</p>
                    </div>
                    {theme === 'system' && (
                      <Badge variant="default" className="bg-primary text-primary-foreground shrink-0">Active</Badge>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters with uppercase, lowercase, number, and special character
                          </p>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            {/* GDPR Status */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>GDPR Consent Status</CardTitle>
                <CardDescription>Your data processing consent information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {profile?.gdpr_consent ? (
                    <Badge variant="default" className="bg-emerald-500">Consent Given</Badge>
                  ) : (
                    <Badge variant="destructive">No Consent</Badge>
                  )}
                </div>
                
                {profile?.gdpr_consent_date && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Consent Date:</span>
                    <span className="text-sm">{format(new Date(profile.gdpr_consent_date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => navigate('/gdpr-consent')}>
                    View GDPR Agreement
                  </Button>
                  
                  {profile?.gdpr_consent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                          Withdraw Consent
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Withdraw GDPR Consent?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Withdrawing your consent may limit your ability to use certain features of the application.
                            Your data will be retained but processing will be restricted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleWithdrawConsent}
                            disabled={isWithdrawingConsent}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isWithdrawingConsent ? 'Withdrawing...' : 'Withdraw Consent'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>Download copies of your data in CSV format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={handleExportPlayers}
                    disabled={isExportingPlayers}
                    className="justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {isExportingPlayers ? 'Exporting...' : 'Export Players'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleExportReports}
                    disabled={isExportingReports}
                    className="justify-start gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {isExportingReports ? 'Exporting...' : 'Export Reports'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Onboarding Tour */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Onboarding Tour</CardTitle>
                <CardDescription>Restart the guided tour to learn about all features</CardDescription>
              </CardHeader>
              <CardContent>
                <RestartTourButton />
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>Sign out of your account on this device</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="card-glass border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Permanently delete your account and all associated data</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data including players, scouting reports, and profile information.
                        </p>
                        <div className="pt-2">
                          <Label htmlFor="delete-confirm" className="text-sm font-medium">
                            Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                          </Label>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="mt-2"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
