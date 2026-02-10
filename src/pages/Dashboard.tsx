import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlayerCard } from '@/components/players/PlayerCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton-card';
import { DraftRecoveryBanner } from '@/components/drafts/DraftRecoveryBanner';
import { supabase, PlayerPosition } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { Users, FileText, Star, TrendingUp, Plus, ArrowRight, Calendar, Crown, Sparkles, Building2, Zap, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    y: -4,
    transition: { duration: 0.15 },
  },
};

interface Player {
  id: string;
  full_name: string;
  position: PlayerPosition;
  date_of_birth: string | null;
  nationality: string | null;
  current_club: string | null;
  photo_url: string | null;
}

interface Report {
  id: string;
  match_date: string;
  overall_rating: number | null;
  player_id: string;
  players: {
    full_name: string;
    position: PlayerPosition;
  };
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const subscription = useSubscription();
  const tour = useOnboardingTour();
  const [searchParams, setSearchParams] = useSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recommendationStats, setRecommendationStats] = useState({ sign: 0, monitor: 0, reject: 0 });
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalReports: 0,
    avgRating: 0,
    thisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Handle subscription success redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      // Payment completed — clear pending flags and refresh
      localStorage.removeItem('pending_pro_signup');
      localStorage.removeItem('pending_promo_code');
      subscription.refreshSubscription();
      toast.success('Subscription activated!', {
        description: 'Your plan has been upgraded successfully.',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, subscription]);

  // Handle pending Pro signup: redirect to Stripe checkout after email confirmation
  useEffect(() => {
    const pendingPro = localStorage.getItem('pending_pro_signup');
    if (pendingPro === 'true' && user) {
      // Check if subscription is already active (payment was completed)
      if (subscription.tier === 'pro' || subscription.isSubscribedViaStripe) {
        localStorage.removeItem('pending_pro_signup');
        localStorage.removeItem('pending_promo_code');
        return;
      }

      // Don't auto-redirect if we just came back from a cancelled checkout
      const subscriptionStatus = searchParams.get('subscription');
      if (subscriptionStatus === 'cancelled') {
        // Keep the pending flag so they can retry, but don't auto-redirect
        return;
      }

      const redirectToCheckout = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) return;

          toast.info('Completing your Pro setup...');
          
          const pendingPromoCode = localStorage.getItem('pending_promo_code') || undefined;
          
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: { tier: 'pro', isAnnual: false, promoCode: pendingPromoCode },
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!error && data?.url) {
            // Don't clear pending flags until payment succeeds (handled by success redirect above)
            window.location.href = data.url;
          } else {
            console.error('Pending checkout failed:', error);
            localStorage.removeItem('pending_pro_signup');
            localStorage.removeItem('pending_promo_code');
            toast.error('Could not start Pro checkout. You can upgrade from Settings.');
          }
        } catch (err) {
          console.error('Pending checkout error:', err);
          localStorage.removeItem('pending_pro_signup');
          localStorage.removeItem('pending_promo_code');
        }
      };
      redirectToCheckout();
    }
  }, [user, subscription.tier, subscription.isSubscribedViaStripe]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Fetch player count
      const { count: playerCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      // Fetch reports with player info
      const { data: reportsData, error: reportsError } = await supabase
        .from('scouting_reports')
        .select(`
          id,
          match_date,
          overall_rating,
          player_id,
          players (
            full_name,
            position
          )
        `)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportsError) throw reportsError;
      setRecentReports(reportsData as unknown as Report[] || []);

      // Fetch report stats
      const { data: allReports } = await supabase
        .from('scouting_reports')
        .select('overall_rating, created_at, recommendation')
        .eq('is_draft', false);

      const totalReports = allReports?.length || 0;
      const avgRating = allReports?.length 
        ? allReports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / allReports.length 
        : 0;

      // This month's reports
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const thisMonthReports = allReports?.filter(
        r => new Date(r.created_at) >= startOfMonth
      ).length || 0;

      // Recommendation breakdown
      const sign = allReports?.filter(r => r.recommendation === 'Sign').length || 0;
      const monitor = allReports?.filter(r => r.recommendation === 'Monitor').length || 0;
      const reject = allReports?.filter(r => r.recommendation === 'Reject').length || 0;
      setRecommendationStats({ sign, monitor, reject });

      setStats({
        totalPlayers: playerCount || 0,
        totalReports,
        avgRating: Math.round(avgRating * 10) / 10,
        thisMonth: thisMonthReports,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <DashboardLayout>
      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={tour.isOpen}
        currentStep={tour.currentStep}
        totalSteps={tour.totalSteps}
        currentTourStep={tour.currentTourStep}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
        onComplete={tour.completeTour}
      />

      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Draft Recovery Banner */}
        <DraftRecoveryBanner />
        {/* Welcome Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20 shadow-lg shrink-0">
              <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-0.5 sm:mt-1">
                Here's your scouting overview.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild data-tour="new-report" className="flex-1 sm:flex-none">
              <Link to="/reports/new">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Report</span>
                <span className="xs:hidden">Report</span>
              </Link>
            </Button>
            <Button variant="hero" asChild data-tour="add-player" className="flex-1 sm:flex-none">
              <Link to="/players/new">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add Player</span>
                <span className="xs:hidden">Player</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-tour="stats-grid">
          <Link to="/players" className="block">
            <StatCard
              title="Total Players"
              value={stats.totalPlayers}
              icon={<Users className="w-5 h-5" />}
              variant="primary"
            />
          </Link>
          <Link to="/reports" className="block">
            <StatCard
              title="Reports Filed"
              value={stats.totalReports}
              icon={<FileText className="w-5 h-5" />}
            />
          </Link>
          <Link to="/reports/analytics" className="block">
            <StatCard
              title="Avg Rating"
              value={stats.avgRating || '-'}
              icon={<Star className="w-5 h-5" />}
              variant="gold"
            />
          </Link>
          <Link to="/reports/analytics" className="block">
            <StatCard
              title="This Month"
              value={stats.thisMonth}
              subtitle="Reports submitted"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </Link>
        </div>

        {/* Subscription Status Card */}
        <Card data-tour="subscription" className={cn(
          "card-glass border-l-4",
          subscription.tier === 'free' ? 'border-l-muted-foreground' : 
          subscription.tier === 'pro' ? 'border-l-primary' : 'border-l-purple-500'
        )}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  subscription.tier === 'free' ? 'bg-muted' :
                  subscription.tier === 'pro' ? 'bg-primary/20' : 'bg-purple-500/20'
                )}>
                  {subscription.tier === 'free' ? <Sparkles className="w-6 h-6 text-muted-foreground" /> :
                   subscription.tier === 'pro' ? <Crown className="w-6 h-6 text-primary" /> :
                   <Building2 className="w-6 h-6 text-purple-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold capitalize">{subscription.tier} Plan</h3>
                    {subscription.isInTrial && (
                      <Badge variant="secondary" className="text-xs">
                        Trial • {subscription.trialDaysRemaining}d left
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.tier === 'free' 
                      ? 'Upgrade to unlock unlimited features' 
                      : subscription.isInTrial && subscription.trialEndsAt
                        ? `Trial ends ${formatDistanceToNow(subscription.trialEndsAt, { addSuffix: true })}`
                        : 'Enjoying unlimited scouting features'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                {/* Usage Stats */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {subscription.usage.playerCount}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{subscription.limits.maxPlayers === Infinity ? '∞' : subscription.limits.maxPlayers}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Players</p>
                    {subscription.tier === 'free' && (
                      <Progress 
                        value={(subscription.usage.playerCount / subscription.limits.maxPlayers) * 100} 
                        className="h-1 w-16 mt-1"
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {subscription.usage.monthlyReportCount}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{subscription.limits.maxReportsPerMonth === Infinity ? '∞' : subscription.limits.maxReportsPerMonth}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reports/mo</p>
                    {subscription.tier === 'free' && (
                      <Progress 
                        value={(subscription.usage.monthlyReportCount / subscription.limits.maxReportsPerMonth) * 100} 
                        className="h-1 w-16 mt-1"
                      />
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                {subscription.tier === 'free' ? (
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/settings?tab=subscription">
                      <Zap className="w-4 h-4 mr-1" />
                      Upgrade
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings?tab=subscription">
                      Manage Plan
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation Breakdown */}
        {(recommendationStats.sign > 0 || recommendationStats.monitor > 0 || recommendationStats.reject > 0) && (
          <Card className="card-glass">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Recommendation Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Link to="/reports?recommendation=Sign" className="text-center p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold text-primary">{recommendationStats.sign}</div>
                  <p className="text-xs text-muted-foreground mt-1">Sign</p>
                </Link>
                <Link to="/reports?recommendation=Monitor" className="text-center p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold text-amber-500">{recommendationStats.monitor}</div>
                  <p className="text-xs text-muted-foreground mt-1">Monitor</p>
                </Link>
                <Link to="/reports?recommendation=Reject" className="text-center p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold text-destructive">{recommendationStats.reject}</div>
                  <p className="text-xs text-muted-foreground mt-1">Reject</p>
                </Link>
              </div>
              {/* Visual bar */}
              {(() => {
                const total = recommendationStats.sign + recommendationStats.monitor + recommendationStats.reject;
                return total > 0 ? (
                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-primary rounded-l-full" style={{ width: `${(recommendationStats.sign / total) * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${(recommendationStats.monitor / total) * 100}%` }} />
                    <div className="bg-destructive rounded-r-full" style={{ width: `${(recommendationStats.reject / total) * 100}%` }} />
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Recent Players */}
          <div className="lg:col-span-2">
            <Card className="card-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Players</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/players">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <SkeletonList count={4} variant="player" />
                  </div>
                ) : players.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                      >
                        <PlayerCard player={player} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No players yet</p>
                    <Button variant="hero" size="sm" asChild>
                      <Link to="/players/new">Add Your First Player</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <div>
            <Card className="card-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Reports</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/reports">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <SkeletonList count={3} variant="report" />
                  </div>
                ) : recentReports.length > 0 ? (
                  <div className="space-y-2">
                    {recentReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        custom={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { delay: index * 0.05 }
                        }}
                        whileHover={{ x: 4 }}
                      >
                        <Link
                          to={`/reports/${report.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted hover:border-primary/30 border border-transparent transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-3 h-3 text-primary" />
                              <p className="font-medium truncate">
                                {report.players?.full_name || 'Unknown Player'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(report.match_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {report.overall_rating && (
                              <div className="rating-badge-sm">
                                {Math.round(report.overall_rating)}
                              </div>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No reports yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
