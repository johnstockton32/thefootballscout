import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlayerCard } from '@/components/players/PlayerCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase, PlayerPosition } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Users, FileText, Star, TrendingUp, Plus, ArrowRight, Calendar, Crown, Sparkles, Building2, Zap } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalReports: 0,
    avgRating: 0,
    thisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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
        .select('overall_rating, created_at')
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
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
              <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's your scouting overview.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/reports/new">
                <FileText className="w-4 h-4 mr-2" />
                New Report
              </Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/players/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Players"
            value={stats.totalPlayers}
            icon={<Users className="w-5 h-5" />}
            variant="primary"
          />
          <StatCard
            title="Reports Filed"
            value={stats.totalReports}
            icon={<FileText className="w-5 h-5" />}
          />
          <StatCard
            title="Avg Rating"
            value={stats.avgRating || '-'}
            icon={<Star className="w-5 h-5" />}
            variant="gold"
          />
          <StatCard
            title="This Month"
            value={stats.thisMonth}
            subtitle="Reports submitted"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Subscription Status Card */}
        <Card className={cn(
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
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
                  <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : players.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {players.map((player) => (
                      <PlayerCard key={player.id} player={player} />
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
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recentReports.length > 0 ? (
                  <div className="space-y-3">
                    {recentReports.map((report) => (
                      <Link
                        key={report.id}
                        to={`/reports/${report.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {report.players?.full_name || 'Unknown Player'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(report.match_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {report.overall_rating && (
                          <div className="rating-badge-sm">
                            {Math.round(report.overall_rating)}
                          </div>
                        )}
                      </Link>
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
