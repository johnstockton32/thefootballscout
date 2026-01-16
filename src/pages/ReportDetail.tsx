import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';
import { VideoClipManager } from '@/components/video/VideoClipManager';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { AttributeBar } from '@/components/reports/AttributeBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  supabase, 
  PlayerPosition, 
  POSITION_LABELS, 
  POSITION_ABBREV,
  CompetitionLevel,
  COMPETITION_LEVEL_LABELS
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { handleError } from '@/lib/errorUtils';
import { exportReportPDF } from '@/lib/export';
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  Clock,
  User,
  FileText,
  Video,
  Brain,
  Target,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  X,
  Star,
  Trophy,
} from 'lucide-react';
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

interface Report {
  id: string;
  match_date: string;
  match_details: string | null;
  opposition: string | null;
  competition_level: CompetitionLevel;
  minutes_observed: number | null;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_first_touch: number | null;
  technical_passing: number | null;
  technical_dribbling: number | null;
  technical_shooting: number | null;
  technical_crossing: number | null;
  technical_heading: number | null;
  tactical_positioning: number | null;
  tactical_decision_making: number | null;
  tactical_awareness: number | null;
  tactical_off_ball_movement: number | null;
  tactical_defensive_contribution: number | null;
  physical_pace: number | null;
  physical_agility: number | null;
  physical_strength: number | null;
  physical_stamina: number | null;
  physical_balance: number | null;
  mental_composure: number | null;
  mental_concentration: number | null;
  mental_work_rate: number | null;
  mental_leadership: number | null;
  mental_aggression: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
  players: {
    id: string;
    full_name: string;
    position: PlayerPosition;
    current_club: string | null;
  };
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchReport();
      fetchTeamLogo();
    }
  }, [id, user]);

  const fetchTeamLogo = async () => {
    try {
      // First get user's team_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile?.team_id) {
        // Then get team's logo
        const { data: team } = await supabase
          .from('teams')
          .select('logo_url')
          .eq('id', profile.team_id)
          .maybeSingle();

        if (team?.logo_url) {
          setTeamLogoUrl(team.logo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching team logo:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('scouting_reports')
        .select(`
          *,
          players (
            id,
            full_name,
            position,
            current_club
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Report not found');
        navigate('/reports');
        return;
      }
      setReport(data as unknown as Report);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;

    try {
      const { error } = await supabase
        .from('scouting_reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Report deleted successfully');
      navigate('/reports');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Delete report'));
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    
    setIsExporting(true);
    try {
      await exportReportPDF(report.id, teamLogoUrl);
      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getRadarData = () => {
    if (!report) return null;

    return [
      { attribute: 'Passing', value: report.technical_passing || 0, fullMark: 20 },
      { attribute: 'Dribbling', value: report.technical_dribbling || 0, fullMark: 20 },
      { attribute: 'Shooting', value: report.technical_shooting || 0, fullMark: 20 },
      { attribute: 'Positioning', value: report.tactical_positioning || 0, fullMark: 20 },
      { attribute: 'Awareness', value: report.tactical_awareness || 0, fullMark: 20 },
      { attribute: 'Pace', value: report.physical_pace || 0, fullMark: 20 },
      { attribute: 'Stamina', value: report.physical_stamina || 0, fullMark: 20 },
      { attribute: 'Composure', value: report.mental_composure || 0, fullMark: 20 },
    ];
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Report not found</p>
          <Button variant="hero" className="mt-4" onClick={() => navigate('/reports')}>
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const radarData = getRadarData();

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 sm:mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm">Back</span>
            </Button>
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Scouting Report</h1>
                <Link
                  to={`/players/${report.players?.id}`}
                  className="text-primary hover:underline flex items-center gap-1 sm:gap-2 mt-1 text-sm sm:text-base flex-wrap"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{report.players?.full_name}</span>
                  <Badge className="position-badge text-xs">
                    {POSITION_ABBREV[report.players?.position]}
                  </Badge>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="flex-1 sm:flex-none text-sm">
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this scouting report. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground w-full sm:w-auto">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Match Info */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <Card className="card-glass">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Match Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-sm sm:text-base truncate">{format(new Date(report.match_date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                {report.opposition && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Opposition</p>
                      <p className="font-medium text-sm sm:text-base truncate">{report.opposition}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Competition Level</p>
                    <p className="font-medium text-sm sm:text-base truncate">{COMPETITION_LEVEL_LABELS[report.competition_level]}</p>
                  </div>
                </div>
                {report.minutes_observed && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Minutes Observed</p>
                      <p className="font-medium text-sm sm:text-base">{report.minutes_observed} min</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="card-gold-glow">
              <CardContent className="py-4 sm:py-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Overall</p>
                    <p className="text-3xl sm:text-4xl font-bold text-gradient-gold">
                      {report.overall_rating ? Math.round(report.overall_rating) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Potential</p>
                    <p className="text-3xl sm:text-4xl font-bold text-gradient-pitch">
                      {report.potential_rating || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attributes & Analysis */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Tabs defaultValue="attributes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-4 h-auto p-1">
                <TabsTrigger value="attributes" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Attributes</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                  <Video className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Video</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                  <Brain className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">AI Insights</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attributes" className="space-y-6">
                {/* Overall Score Display - matching Demo style */}
                {(() => {
                  const tech = [
                    report.technical_first_touch,
                    report.technical_passing,
                    report.technical_dribbling,
                    report.technical_shooting,
                    report.technical_crossing,
                    report.technical_heading,
                  ].filter(v => v !== null) as number[];
                  const tact = [
                    report.tactical_positioning,
                    report.tactical_decision_making,
                    report.tactical_awareness,
                    report.tactical_off_ball_movement,
                    report.tactical_defensive_contribution,
                  ].filter(v => v !== null) as number[];
                  const phys = [
                    report.physical_pace,
                    report.physical_agility,
                    report.physical_strength,
                    report.physical_stamina,
                    report.physical_balance,
                  ].filter(v => v !== null) as number[];
                  const ment = [
                    report.mental_composure,
                    report.mental_concentration,
                    report.mental_work_rate,
                    report.mental_leadership,
                    report.mental_aggression,
                  ].filter(v => v !== null) as number[];
                  
                  const techAvg = tech.length > 0 ? tech.reduce((a, b) => a + b, 0) / tech.length : 0;
                  const tactAvg = tact.length > 0 ? tact.reduce((a, b) => a + b, 0) / tact.length : 0;
                  const physAvg = phys.length > 0 ? phys.reduce((a, b) => a + b, 0) / phys.length : 0;
                  const mentAvg = ment.length > 0 ? ment.reduce((a, b) => a + b, 0) / ment.length : 0;
                  
                  const overallScore = Math.round(((techAvg + tactAvg + physAvg + mentAvg) / 4) * 5);
                  
                  const getScoreColor = (score: number) => {
                    if (score >= 85) return 'text-primary';
                    if (score >= 70) return 'text-amber-500';
                    if (score >= 55) return 'text-blue-500';
                    return 'text-muted-foreground';
                  };
                  
                  const getScoreLabel = (score: number) => {
                    if (score >= 90) return 'World Class';
                    if (score >= 80) return 'Excellent';
                    if (score >= 70) return 'Very Good';
                    if (score >= 60) return 'Good';
                    if (score >= 50) return 'Average';
                    return 'Developing';
                  };
                  
                  const categories = [
                    { name: 'Technical', avg: Math.round(techAvg), icon: Target, color: 'bg-primary', textColor: 'text-primary' },
                    { name: 'Tactical', avg: Math.round(tactAvg), icon: BarChart3, color: 'bg-blue-500', textColor: 'text-blue-500' },
                    { name: 'Physical', avg: Math.round(physAvg), icon: Zap, color: 'bg-amber-500', textColor: 'text-amber-500' },
                    { name: 'Mental', avg: Math.round(mentAvg), icon: Shield, color: 'bg-purple-500', textColor: 'text-purple-500' },
                  ];
                  
                  return (
                    <>
                      {/* Overall Score Card */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card className="card-glass border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                          <CardContent className="py-4 sm:py-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Overall Match Rating</p>
                                <div className="flex items-baseline gap-1 sm:gap-2">
                                  <span className={`text-3xl sm:text-4xl md:text-5xl font-bold ${getScoreColor(overallScore)}`}>
                                    {overallScore}
                                  </span>
                                  <span className="text-base sm:text-xl text-muted-foreground">/100</span>
                                </div>
                                <p className={`text-xs sm:text-sm font-medium mt-1 ${getScoreColor(overallScore)}`}>
                                  {getScoreLabel(overallScore)}
                                </p>
                              </div>
                              
                              {/* Circular Progress */}
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="hsl(var(--muted))"
                                    strokeWidth="8"
                                  />
                                  <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="hsl(158, 64%, 45%)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={251.2}
                                    initial={{ strokeDashoffset: 251.2 }}
                                    animate={{ strokeDashoffset: 251.2 - (251.2 * overallScore) / 100 }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Category breakdown bar */}
                            <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
                              {categories.map((cat, i) => (
                                <motion.div
                                  key={cat.name}
                                  initial={{ width: 0 }}
                                  animate={{ width: '25%' }}
                                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                  className={`${cat.color}`}
                                  style={{ opacity: 0.3 + (cat.avg / 20) * 0.7 }}
                                  title={`${cat.name}: ${cat.avg}/20`}
                                />
                              ))}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                              <span>Technical</span>
                              <span>Tactical</span>
                              <span>Physical</span>
                              <span>Mental</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                      
                      {/* Category Averages Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                        {categories.map((cat, index) => (
                          <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="card-glass hover:border-primary/30 transition-colors">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${cat.color}/20 flex items-center justify-center shrink-0`}>
                                    <cat.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${cat.textColor}`} />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                  <span className="text-xl sm:text-2xl font-bold">{cat.avg}</span>
                                  <span className="text-xs sm:text-sm text-muted-foreground mb-0.5">/20</span>
                                </div>
                                <div className="mt-2 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(cat.avg / 20) * 100}%` }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className={`h-full ${cat.color} rounded-full`}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {/* Radar Chart */}
                {radarData && (
                  <Card className="card-glass">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Attribute Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AttributeRadarChart data={radarData} />
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Attributes with Progress Bars */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Attributes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                      {/* Technical */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Technical
                        </h4>
                        <div className="space-y-2">
                          <AttributeBar name="First Touch" value={report.technical_first_touch} />
                          <AttributeBar name="Passing" value={report.technical_passing} />
                          <AttributeBar name="Dribbling" value={report.technical_dribbling} />
                          <AttributeBar name="Shooting" value={report.technical_shooting} />
                          <AttributeBar name="Crossing" value={report.technical_crossing} />
                          <AttributeBar name="Heading" value={report.technical_heading} />
                        </div>
                      </div>

                      {/* Tactical */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Tactical
                        </h4>
                        <div className="space-y-2">
                          <AttributeBar name="Positioning" value={report.tactical_positioning} />
                          <AttributeBar name="Decision Making" value={report.tactical_decision_making} />
                          <AttributeBar name="Awareness" value={report.tactical_awareness} />
                          <AttributeBar name="Off-Ball Movement" value={report.tactical_off_ball_movement} />
                          <AttributeBar name="Def. Contribution" value={report.tactical_defensive_contribution} />
                        </div>
                      </div>

                      {/* Physical */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-amber-500 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Physical
                        </h4>
                        <div className="space-y-2">
                          <AttributeBar name="Pace" value={report.physical_pace} />
                          <AttributeBar name="Agility" value={report.physical_agility} />
                          <AttributeBar name="Strength" value={report.physical_strength} />
                          <AttributeBar name="Stamina" value={report.physical_stamina} />
                          <AttributeBar name="Balance" value={report.physical_balance} />
                        </div>
                      </div>

                      {/* Mental */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-purple-500 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Mental
                        </h4>
                        <div className="space-y-2">
                          <AttributeBar name="Composure" value={report.mental_composure} />
                          <AttributeBar name="Concentration" value={report.mental_concentration} />
                          <AttributeBar name="Work Rate" value={report.mental_work_rate} />
                          <AttributeBar name="Leadership" value={report.mental_leadership} />
                          <AttributeBar name="Aggression" value={report.mental_aggression} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis - Strengths/Weaknesses with styled panels */}
                {(report.strengths || report.weaknesses || report.recommendation) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {report.strengths && (
                      <Card className="card-glass border-primary/20 bg-primary/5">
                        <CardContent className="p-5">
                          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Strengths
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-wrap text-sm">{report.strengths}</p>
                        </CardContent>
                      </Card>
                    )}
                    {report.weaknesses && (
                      <Card className="card-glass border-destructive/20 bg-destructive/5">
                        <CardContent className="p-5">
                          <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                            <X className="w-4 h-4" />
                            Areas to Improve
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-wrap text-sm">{report.weaknesses}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {report.recommendation && (
                  <Card className="card-glass">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Recommendation
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{report.recommendation}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="video">
                <VideoClipManager reportId={report.id} />
              </TabsContent>

              <TabsContent value="insights">
                <AIInsightsPanel 
                  player={{
                    id: report.players?.id || '',
                    full_name: report.players?.full_name || 'Player',
                    position: report.players?.position || 'striker',
                    current_club: report.players?.current_club || null,
                    nationality: null,
                    date_of_birth: null,
                  }} 
                  reports={[report]} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
