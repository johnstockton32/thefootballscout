import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, FileText, Star, Calendar, 
  Activity, Target, BarChart3 
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthlyData {
  month: string;
  reports: number;
  avgRating: number;
}

interface CompetitionData {
  name: string;
  value: number;
}

interface RecommendationData {
  name: string;
  value: number;
}

const COMPETITION_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
const RECOMMENDATION_COLORS = {
  'Sign immediately': '#22c55e',
  'Monitor closely': '#3b82f6',
  'Continue monitoring': '#f59e0b',
  'Not recommended': '#ef4444',
};

export default function ReportsAnalytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [competitionData, setCompetitionData] = useState<CompetitionData[]>([]);
  const [recommendationData, setRecommendationData] = useState<RecommendationData[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    avgRating: 0,
    highestRating: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all reports
      const { data: reports, error } = await supabase
        .from('scouting_reports')
        .select('*')
        .eq('is_draft', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!reports || reports.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate stats
      const totalReports = reports.length;
      const avgRating = reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / totalReports;
      const highestRating = Math.max(...reports.map(r => r.overall_rating || 0));
      
      const startOfThisMonth = startOfMonth(new Date());
      const thisMonth = reports.filter(r => new Date(r.created_at) >= startOfThisMonth).length;

      setStats({
        totalReports,
        avgRating: Math.round(avgRating * 10) / 10,
        highestRating: Math.round(highestRating * 10) / 10,
        thisMonth,
      });

      // Calculate monthly data for the last 6 months
      const monthlyStats: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthReports = reports.filter(r => {
          const date = new Date(r.created_at);
          return date >= monthStart && date <= monthEnd;
        });

        const monthAvg = monthReports.length > 0
          ? monthReports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / monthReports.length
          : 0;

        monthlyStats.push({
          month: format(monthStart, 'MMM'),
          reports: monthReports.length,
          avgRating: Math.round(monthAvg * 10) / 10,
        });
      }
      setMonthlyData(monthlyStats);

      // Calculate competition level distribution
      const competitionCounts: Record<string, number> = {};
      reports.forEach(r => {
        const level = r.competition_level.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        competitionCounts[level] = (competitionCounts[level] || 0) + 1;
      });
      setCompetitionData(
        Object.entries(competitionCounts).map(([name, value]) => ({ name, value }))
      );

      // Calculate recommendation distribution
      const recommendationCounts: Record<string, number> = {};
      reports.forEach(r => {
        if (r.recommendation) {
          recommendationCounts[r.recommendation] = (recommendationCounts[r.recommendation] || 0) + 1;
        }
      });
      setRecommendationData(
        Object.entries(recommendationCounts).map(([name, value]) => ({ name, value }))
      );

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, className }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    className?: string;
  }) => (
    <Card className={cn('card-glass', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/reports">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Reports Analytics</h1>
              <p className="text-muted-foreground">
                Insights and trends from your scouting reports
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.totalReports === 0 ? (
          <Card className="card-glass">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Reports Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start creating scouting reports to see analytics and trends.
              </p>
              <Button variant="hero" asChild>
                <Link to="/reports/new">Create Your First Report</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Reports" 
                value={stats.totalReports} 
                icon={<FileText className="w-5 h-5 text-primary" />} 
              />
              <StatCard 
                title="Average Rating" 
                value={stats.avgRating} 
                icon={<Star className="w-5 h-5 text-accent" />} 
              />
              <StatCard 
                title="Highest Rating" 
                value={stats.highestRating} 
                icon={<Target className="w-5 h-5 text-status-success" />} 
              />
              <StatCard 
                title="This Month" 
                value={stats.thisMonth} 
                icon={<Calendar className="w-5 h-5 text-primary" />} 
              />
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Reports Chart */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Monthly Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar 
                          dataKey="reports" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                          name="Reports"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Rating Trend Chart */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Rating Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgRating" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                          name="Avg Rating"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Level Distribution */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Competition Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={competitionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {competitionData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COMPETITION_COLORS[index % COMPETITION_COLORS.length]} />
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

              {/* Recommendation Distribution */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-status-success" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendationData.length > 0 ? (
                    <div className="space-y-4">
                      {recommendationData.map((item) => {
                        const total = recommendationData.reduce((acc, r) => acc + r.value, 0);
                        const percentage = Math.round((item.value / total) * 100);
                        const color = RECOMMENDATION_COLORS[item.name as keyof typeof RECOMMENDATION_COLORS] || '#6b7280';
                        
                        return (
                          <div key={item.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">{item.value} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No recommendation data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
