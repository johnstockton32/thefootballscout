import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Lock, Trash2, LogOut, FileText, Users, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { exportPlayersCSV, exportReportsCSV } from '@/lib/export';
import { handleError } from '@/lib/errorUtils';
import { ProfilePhotoUpload } from '@/components/settings/ProfilePhotoUpload';
import { format } from 'date-fns';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
  organization: z.string().trim().max(200, 'Organization must be less than 200 characters').optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, updateGdprConsent, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingPlayers, setIsExportingPlayers] = useState(false);
  const [isExportingReports, setIsExportingReports] = useState(false);
  const [isWithdrawingConsent, setIsWithdrawingConsent] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      organization: profile?.organization || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
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

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

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
                      <Label>Email</Label>
                      <Input value={user?.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
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
