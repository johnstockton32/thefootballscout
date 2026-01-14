import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, FileText, Star, TrendingUp, Activity,
  Crown, ArrowLeft, Target, Calendar, Building2
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface TeamMemberStats {
  id: string;
  full_name: string;
  photo_url: string | null;
  reports_count: number;
  players_count: number;
  avg_rating: number;
}

interface DailyActivity {
  date: string;
  reports: number;
  players: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function TeamAnalytics() {
  const { user, profile } = useAuth();
  const { tier, limits } = useSubscription();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [memberStats, setMemberStats] = useState<TeamMemberStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [totals, setTotals] = useState({
    members: 0,
    players: 0,
    reports: 0,
    avgRating: 0,
  });

  const teamId = profile?.team_id;
  const hasTeamFeatures = limits.hasTeamFeatures;

  useEffect(() => {
    if (user && teamId && hasTeamFeatures) {
      fetchTeamAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [user, teamId, hasTeamFeatures]);

  const fetchTeamAnalytics = async () => {
    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, photo_url')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Fetch stats for each member
      const memberStatsPromises = (members || []).map(async (member) => {
        const [reportsResult, playersResult] = await Promise.all([
          supabase
            .from('scouting_reports')
            .select('overall_rating')
            .eq('scout_id', member.id)
            .eq('is_draft', false),
          supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .eq('scout_id', member.id),
        ]);

        const reports = reportsResult.data || [];
        const avgRating = reports.length > 0
          ? reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reports.length
          : 0;

        return {
          id: member.id,
          full_name: member.full_name || 'Unknown',
          photo_url: member.photo_url,
          reports_count: reports.length,
          players_count: playersResult.count || 0,
          avg_rating: Math.round(avgRating * 10) / 10,
        };
      });

      const stats = await Promise.all(memberStatsPromises);
      setMemberStats(stats.sort((a, b) => b.reports_count - a.reports_count));

      // Calculate totals
      const totalPlayers = stats.reduce((acc, s) => acc + s.players_count, 0);
      const totalReports = stats.reduce((acc, s) => acc + s.reports_count, 0);
      const avgRating = stats.length > 0
        ? stats.reduce((acc, s) => acc + s.avg_rating, 0) / stats.filter(s => s.avg_rating > 0).length
        : 0;

      setTotals({
        members: stats.length,
        players: totalPlayers,
        reports: totalReports,
        avgRating: Math.round(avgRating * 10) / 10 || 0,
      });

      // Fetch daily activity for last 7 days
      const last7Days: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = startOfDay(subDays(date, -1)).toISOString();

        const [reportsCount, playersCount] = await Promise.all([
          supabase
            .from('scouting_reports')
            .select('id', { count: 'exact', head: true })
            .in('scout_id', stats.map(s => s.id))
            .gte('created_at', dayStart)
            .lt('created_at', dayEnd),
          supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .in('scout_id', stats.map(s => s.id))
            .gte('created_at', dayStart)
            .lt('created_at', dayEnd),
        ]);

        last7Days.push({
          date: format(date, 'EEE'),
          reports: reportsCount.count || 0,
          players: playersCount.count || 0,
        });
      }
      setDailyActivity(last7Days);

    } catch (error) {
      console.error('Error fetching team analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!hasTeamFeatures) {
    return (
      <SubscriptionGate
        requiredTier="team"
        feature="hasTeamFeatures"
        featureName="Team Analytics"
        featureDescription="Get insights into your team's scouting activity, performance metrics, and collaboration stats. Upgrade to Team or Agency to unlock."
      >
        <div />
      </SubscriptionGate>
    );
  }

  if (!teamId) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Team Analytics</h1>
              <p className="text-muted-foreground">
                Insights from your team's scouting activity
              </p>
            </div>
          </div>

          <Card className="card-glass">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Team Found</h2>
              <p className="text-muted-foreground">
                You're not part of a team yet. Create or join a team to see analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Team Analytics</h1>
            <p className="text-muted-foreground">
              Performance insights for your scouting team
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/teams')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team Members</p>
                      <p className="text-2xl font-bold">{totals.members}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/players')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Players</p>
                      <p className="text-2xl font-bold">{totals.players}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/reports')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reports</p>
                      <p className="text-2xl font-bold">{totals.reports}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/reports/analytics')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Star className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold">{totals.avgRating || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Activity */}
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/team-feed')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Weekly Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="reports" name="Reports" fill="#22c55e" radius={[4, 4, 0, 0]} cursor="pointer" />
                        <Bar dataKey="players" name="Players Added" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Member Contribution */}
              <Card 
                className="card-glass cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30"
                onClick={() => navigate('/teams')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Member Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memberStats.filter(m => m.reports_count > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          dataKey="reports_count"
                          nameKey="full_name"
                          label={({ name, percent }) => 
                            `${name.split(' ')[0]} (${Math.round(percent * 100)}%)`
                          }
                          labelLine={false}
                          cursor="pointer"
                        >
                          {memberStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Member Leaderboard */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Team Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memberStats.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" 
                        style={{ 
                          backgroundColor: index < 3 ? COLORS[index] : 'hsl(var(--muted))',
                          color: index < 3 ? 'white' : 'hsl(var(--muted-foreground))'
                        }}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.players_count} players scouted
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{member.reports_count}</p>
                        <p className="text-xs text-muted-foreground">reports</p>
                      </div>
                      {member.avg_rating > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          <Star className="w-3 h-3 mr-1" />
                          {member.avg_rating}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {memberStats.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No team members found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}