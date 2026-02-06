import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';
import { PlayerTrendChart } from '@/components/charts/PlayerTrendChart';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { AddToWatchlistButton } from '@/components/watchlists/AddToWatchlistButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayerPhotoUpload } from '@/components/players/PlayerPhotoUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  supabase, 
  PlayerPosition, 
  POSITION_LABELS, 
  POSITION_ABBREV,
  calculateAge,
  CompetitionLevel,
  COMPETITION_LEVEL_LABELS
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorUtils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  User,
  FileText,
  Save,
  X,
  TrendingUp,
  Brain,
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
import { usePlayerPhotoUrl } from '@/hooks/useSignedUrl';

interface Player {
  id: string;
  full_name: string;
  position: PlayerPosition;
  secondary_position: PlayerPosition | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_club: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

interface Report {
  id: string;
  match_date: string;
  match_details: string | null;
  opposition: string | null;
  competition_level: CompetitionLevel;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_first_touch: number | null;
  technical_passing: number | null;
  technical_dribbling: number | null;
  technical_shooting: number | null;
  tactical_positioning: number | null;
  tactical_awareness: number | null;
  physical_pace: number | null;
  physical_stamina: number | null;
  mental_composure: number | null;
  mental_work_rate: number | null;
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const playerPhotoUrl = usePlayerPhotoUrl(player?.photo_url ?? null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    position: '',
    secondary_position: '',
    date_of_birth: '',
    nationality: '',
    current_club: '',
    height_cm: '',
    weight_kg: '',
    preferred_foot: '',
    notes: '',
    photo_url: null as string | null,
  });

  useEffect(() => {
    if (id && user) {
      fetchPlayerData();
    }
  }, [id, user]);

  const fetchPlayerData = async () => {
    try {
      // Fetch player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (playerError) throw playerError;
      if (!playerData) {
        toast.error('Player not found');
        navigate('/players');
        return;
      }
      setPlayer(playerData);

      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('scouting_reports')
        .select('*')
        .eq('player_id', id)
        .eq('is_draft', false)
        .order('match_date', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching player:', error);
      toast.error('Failed to load player data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!player) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', player.id);

      if (error) throw error;

      toast.success('Player deleted successfully');
      navigate('/players');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Delete player'));
    }
  };

  const startEditing = () => {
    if (!player) return;
    setEditData({
      full_name: player.full_name,
      position: player.position,
      secondary_position: player.secondary_position || '',
      date_of_birth: player.date_of_birth || '',
      nationality: player.nationality || '',
      current_club: player.current_club || '',
      height_cm: player.height_cm?.toString() || '',
      weight_kg: player.weight_kg?.toString() || '',
      preferred_foot: player.preferred_foot || '',
      notes: player.notes || '',
      photo_url: player.photo_url,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleEditChange = (field: string, value: string | null) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    if (!player) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('players')
        .update({
          full_name: editData.full_name.trim(),
          position: editData.position as PlayerPosition,
          secondary_position: editData.secondary_position ? editData.secondary_position as PlayerPosition : null,
          date_of_birth: editData.date_of_birth || null,
          nationality: editData.nationality.trim() || null,
          current_club: editData.current_club.trim() || null,
          height_cm: editData.height_cm ? parseInt(editData.height_cm) : null,
          weight_kg: editData.weight_kg ? parseInt(editData.weight_kg) : null,
          preferred_foot: editData.preferred_foot || null,
          notes: editData.notes.trim() || null,
          photo_url: editData.photo_url,
        })
        .eq('id', player.id);

      if (error) throw error;

      // Update local state
      setPlayer({
        ...player,
        full_name: editData.full_name.trim(),
        position: editData.position as PlayerPosition,
        secondary_position: editData.secondary_position ? editData.secondary_position as PlayerPosition : null,
        date_of_birth: editData.date_of_birth || null,
        nationality: editData.nationality.trim() || null,
        current_club: editData.current_club.trim() || null,
        height_cm: editData.height_cm ? parseInt(editData.height_cm) : null,
        weight_kg: editData.weight_kg ? parseInt(editData.weight_kg) : null,
        preferred_foot: editData.preferred_foot || null,
        notes: editData.notes.trim() || null,
        photo_url: editData.photo_url,
      });

      setIsEditing(false);
      toast.success('Player updated successfully');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Update player'));
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate average attributes for radar chart
  const getAverageAttributes = () => {
    if (reports.length === 0) return null;

    const avgAttr = (key: keyof Report) => {
      const values = reports.map((r) => r[key] as number | null).filter((v) => v !== null);
      return values.length > 0 ? values.reduce((a, b) => a + (b || 0), 0) / values.length : 0;
    };

    return [
      { attribute: 'Passing', value: avgAttr('technical_passing'), fullMark: 20 },
      { attribute: 'Dribbling', value: avgAttr('technical_dribbling'), fullMark: 20 },
      { attribute: 'Shooting', value: avgAttr('technical_shooting'), fullMark: 20 },
      { attribute: 'Positioning', value: avgAttr('tactical_positioning'), fullMark: 20 },
      { attribute: 'Awareness', value: avgAttr('tactical_awareness'), fullMark: 20 },
      { attribute: 'Pace', value: avgAttr('physical_pace'), fullMark: 20 },
      { attribute: 'Stamina', value: avgAttr('physical_stamina'), fullMark: 20 },
      { attribute: 'Composure', value: avgAttr('mental_composure'), fullMark: 20 },
    ];
  };

  const avgRating = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reports.length)
    : null;

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

  if (!player) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Player not found</p>
          <Button variant="hero" className="mt-4" onClick={() => navigate('/players')}>
            Back to Players
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const radarData = getAverageAttributes();

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
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                {playerPhotoUrl ? (
                  <img src={playerPhotoUrl} alt={player.full_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{player.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="position-badge">{POSITION_ABBREV[player.position]}</Badge>
                  <span className="text-muted-foreground">{POSITION_LABELS[player.position]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="hero" onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <AddToWatchlistButton playerId={player.id} />
                <Button variant="hero" asChild>
                  <Link to={`/reports/new?playerId=${player.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Report
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Player</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {player.full_name} and all associated scouting reports. This action cannot be undone.
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
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isEditing ? 'Edit Player' : 'Player Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && user ? (
                  <>
                    {/* Photo Upload in Edit Mode */}
                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <PlayerPhotoUpload
                        photoUrl={editData.photo_url}
                        onPhotoChange={(url) => handleEditChange('photo_url', url)}
                        playerName={editData.full_name}
                        userId={user.id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={editData.full_name}
                        onChange={(e) => handleEditChange('full_name', e.target.value)}
                        className="bg-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={editData.position} onValueChange={(v) => handleEditChange('position', v)}>
                        <SelectTrigger className="bg-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(POSITION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Position</Label>
                      <Select 
                        value={editData.secondary_position || 'none'} 
                        onValueChange={(v) => handleEditChange('secondary_position', v === 'none' ? '' : v)}
                      >
                        <SelectTrigger className="bg-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {Object.entries(POSITION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editData.date_of_birth}
                        onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                        className="bg-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Input
                        value={editData.nationality}
                        onChange={(e) => handleEditChange('nationality', e.target.value)}
                        className="bg-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Current Club</Label>
                      <Input
                        value={editData.current_club}
                        onChange={(e) => handleEditChange('current_club', e.target.value)}
                        className="bg-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={editData.height_cm}
                          onChange={(e) => handleEditChange('height_cm', e.target.value)}
                          className="bg-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          value={editData.weight_kg}
                          onChange={(e) => handleEditChange('weight_kg', e.target.value)}
                          className="bg-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Foot</Label>
                      <Select 
                        value={editData.preferred_foot || 'none'} 
                        onValueChange={(v) => handleEditChange('preferred_foot', v === 'none' ? '' : v)}
                      >
                        <SelectTrigger className="bg-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={editData.notes}
                        onChange={(e) => handleEditChange('notes', e.target.value)}
                        className="bg-input min-h-[80px]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {player.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-medium">{calculateAge(player.date_of_birth)} years</p>
                        </div>
                      </div>
                    )}
                    {player.nationality && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{player.nationality}</p>
                        </div>
                      </div>
                    )}
                    {player.current_club && (
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Club</p>
                          <p className="font-medium">{player.current_club}</p>
                        </div>
                      </div>
                    )}
                    {player.height_cm && (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Height</p>
                          <p className="font-medium">{player.height_cm} cm</p>
                        </div>
                      </div>
                    )}
                    {player.weight_kg && (
                      <div className="flex items-center gap-3">
                        <Weight className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="font-medium">{player.weight_kg} kg</p>
                        </div>
                      </div>
                    )}
                    {player.preferred_foot && (
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 text-muted-foreground text-center">🦶</span>
                        <div>
                          <p className="text-sm text-muted-foreground">Preferred Foot</p>
                          <p className="font-medium capitalize">{player.preferred_foot}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Average Rating */}
            {avgRating !== null && (
              <Card className="card-gold-glow">
                <CardContent className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Average Rating</p>
                  <p className="text-5xl font-bold text-gradient-gold">{avgRating}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {reports.length} report{reports.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reports & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radar Chart & Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
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

                {/* Reports List */}
                <Card className="card-glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Scouting Reports</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/reports/new?playerId=${player.id}`}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Report
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {reports.length > 0 ? (
                      <div className="space-y-3">
                        {reports.map((report) => (
                          <Link
                            key={report.id}
                            to={`/reports/${report.id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                  {format(new Date(report.match_date), 'MMMM d, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                vs {report.opposition || 'Unknown'} • {COMPETITION_LEVEL_LABELS[report.competition_level]}
                              </p>
                            </div>
                            {report.overall_rating && (
                              <div className="rating-badge-sm">{Math.round(report.overall_rating)}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No reports yet for this player</p>
                        <Button variant="hero" size="sm" asChild>
                          <Link to={`/reports/new?playerId=${player.id}`}>Create First Report</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends">
                <PlayerTrendChart reports={reports} />
              </TabsContent>

              <TabsContent value="insights">
                <AIInsightsPanel 
                  player={{
                    id: player.id,
                    full_name: player.full_name,
                    position: player.position,
                    current_club: player.current_club,
                    nationality: player.nationality,
                    date_of_birth: player.date_of_birth,
                  }} 
                  reports={reports} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
