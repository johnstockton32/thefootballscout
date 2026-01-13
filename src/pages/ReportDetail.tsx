import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { exportReportPDF } from '@/lib/export';
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  Clock,
  User,
  FileText,
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
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchReport();
    }
  }, [id, user]);

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
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'Failed to delete report');
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    
    setIsExporting(true);
    try {
      await exportReportPDF(report.id);
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Scouting Report</h1>
                <Link
                  to={`/players/${report.players?.id}`}
                  className="text-primary hover:underline flex items-center gap-2 mt-1"
                >
                  <User className="w-4 h-4" />
                  {report.players?.full_name}
                  <Badge className="position-badge ml-1">
                    {POSITION_ABBREV[report.players?.position]}
                  </Badge>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this scouting report. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Match Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg">Match Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(report.match_date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                {report.opposition && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Opposition</p>
                      <p className="font-medium">{report.opposition}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Competition Level</p>
                    <p className="font-medium">{COMPETITION_LEVEL_LABELS[report.competition_level]}</p>
                  </div>
                </div>
                {report.minutes_observed && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Minutes Observed</p>
                      <p className="font-medium">{report.minutes_observed} min</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="card-gold-glow">
              <CardContent className="py-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Overall</p>
                    <p className="text-4xl font-bold text-gradient-gold">
                      {report.overall_rating ? Math.round(report.overall_rating) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Potential</p>
                    <p className="text-4xl font-bold text-gradient-pitch">
                      {report.potential_rating || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attributes & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radar Chart */}
            {radarData && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg">Attribute Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttributeRadarChart data={radarData} />
                </CardContent>
              </Card>
            )}

            {/* Detailed Attributes */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg">Detailed Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Technical */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Technical</h4>
                    <div className="space-y-2">
                      {[
                        ['First Touch', report.technical_first_touch],
                        ['Passing', report.technical_passing],
                        ['Dribbling', report.technical_dribbling],
                        ['Shooting', report.technical_shooting],
                        ['Crossing', report.technical_crossing],
                        ['Heading', report.technical_heading],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="font-medium">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Tactical</h4>
                    <div className="space-y-2">
                      {[
                        ['Positioning', report.tactical_positioning],
                        ['Decision Making', report.tactical_decision_making],
                        ['Awareness', report.tactical_awareness],
                        ['Off-Ball Movement', report.tactical_off_ball_movement],
                        ['Defensive Contribution', report.tactical_defensive_contribution],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="font-medium">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Physical */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Physical</h4>
                    <div className="space-y-2">
                      {[
                        ['Pace', report.physical_pace],
                        ['Agility', report.physical_agility],
                        ['Strength', report.physical_strength],
                        ['Stamina', report.physical_stamina],
                        ['Balance', report.physical_balance],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="font-medium">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mental */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Mental</h4>
                    <div className="space-y-2">
                      {[
                        ['Composure', report.mental_composure],
                        ['Concentration', report.mental_concentration],
                        ['Work Rate', report.mental_work_rate],
                        ['Leadership', report.mental_leadership],
                        ['Aggression', report.mental_aggression],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="font-medium">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis */}
            {(report.strengths || report.weaknesses || report.recommendation) && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg">Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {report.strengths && (
                    <div>
                      <h4 className="font-semibold text-green-500 mb-2">Strengths</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{report.strengths}</p>
                    </div>
                  )}
                  {report.weaknesses && (
                    <div>
                      <h4 className="font-semibold text-red-500 mb-2">Weaknesses</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{report.weaknesses}</p>
                    </div>
                  )}
                  {report.recommendation && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Recommendation</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{report.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
