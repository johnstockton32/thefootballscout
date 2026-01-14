import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, ShieldCheck, Trash2, ArrowLeft, Search, FileText, Crown, Eye, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Player {
  id: string;
  full_name: string;
  position: string;
  current_club: string | null;
  nationality: string | null;
  scout_id: string;
  scout_name?: string;
  scout_email?: string;
  created_at: string;
}

interface Report {
  id: string;
  player_name: string;
  match_date: string;
  competition_level: string;
  overall_rating: number | null;
  scout_id: string;
  scout_name?: string;
  scout_email?: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  member_count: number;
  created_at: string;
}

export default function AdminData() {
  const { isAdmin, isSuperAdmin, profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('players');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, isSuperAdmin]);

  const fetchData = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let playersQuery = supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && profile?.team_id) {
        const { data: teamProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('team_id', profile.team_id);
        
        const teamScoutIds = teamProfiles?.map(p => p.id) || [];
        if (teamScoutIds.length > 0) {
          playersQuery = playersQuery.in('scout_id', teamScoutIds);
        } else {
          setPlayers([]);
          setReports([]);
          setTeams([]);
          setIsLoading(false);
          return;
        }
      } else if (!isSuperAdmin) {
        playersQuery = playersQuery.eq('scout_id', profile?.id || '');
      }

      const { data: playersData, error: playersError } = await playersQuery;

      if (playersError) throw playersError;

      const enrichedPlayers: Player[] = (playersData || []).map(player => {
        const scout = profileMap.get(player.scout_id);
        return {
          ...player,
          scout_name: scout?.full_name,
          scout_email: scout?.email,
        };
      });
      setPlayers(enrichedPlayers);

      let reportsQuery = supabase
        .from('scouting_reports')
        .select('*, players(full_name)')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && profile?.team_id) {
        const { data: teamProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('team_id', profile.team_id);
        
        const teamScoutIds = teamProfiles?.map(p => p.id) || [];
        if (teamScoutIds.length > 0) {
          reportsQuery = reportsQuery.in('scout_id', teamScoutIds);
        }
      } else if (!isSuperAdmin) {
        reportsQuery = reportsQuery.eq('scout_id', profile?.id || '');
      }

      const { data: reportsData, error: reportsError } = await reportsQuery;

      if (reportsError) throw reportsError;

      const enrichedReports: Report[] = (reportsData || []).map(report => {
        const scout = profileMap.get(report.scout_id);
        return {
          id: report.id,
          player_name: report.players?.full_name || 'Unknown',
          match_date: report.match_date,
          competition_level: report.competition_level,
          overall_rating: report.overall_rating,
          scout_id: report.scout_id,
          scout_name: scout?.full_name,
          scout_email: scout?.email,
          created_at: report.created_at,
        };
      });
      setReports(enrichedReports);

      let teamsData: any[] = [];
      if (isSuperAdmin) {
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (teamsError) throw teamsError;
        teamsData = data || [];
      } else if (profile?.team_id) {
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', profile.team_id);
        
        if (teamsError) throw teamsError;
        teamsData = data || [];
      }

      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('team_id');

      const enrichedTeams: Team[] = (teamsData || []).map(team => {
        const owner = profileMap.get(team.owner_id);
        const memberCount = teamMembers?.filter(m => m.team_id === team.id).length || 0;
        return {
          ...team,
          owner_name: owner?.full_name,
          owner_email: owner?.email,
          member_count: memberCount,
        };
      });
      setTeams(enrichedTeams);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      await supabase.from('scouting_reports').delete().eq('player_id', id);
      
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;

      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success('Player and all reports deleted');
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from('scouting_reports').delete().eq('id', id);
      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Report deleted');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ team_id: null, team_role: null })
        .eq('team_id', id);
      
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;

      setTeams(prev => prev.filter(t => t.id !== id));
      toast.success('Team deleted');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const filteredPlayers = players.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.current_club?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.scout_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reports.filter(r =>
    r.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.scout_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 md:w-7 md:h-7 text-primary shrink-0" />
              <span className="truncate">{isSuperAdmin ? 'Data Management' : 'Team Data'}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {isSuperAdmin ? 'Manage players, reports, and teams' : 'Manage your team\'s data'}
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="card-glass">
          <CardContent className="py-3 md:py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search across all data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Players</span> ({players.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 md:gap-2 text-xs md:text-sm">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Reports</span> ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Crown className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Teams</span> ({teams.length})
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="card-glass">
              <CardContent className="pt-4 md:pt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No players found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPlayers.slice(0, 50).map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{player.full_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {player.position.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{player.current_club || 'No club'}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Scout: {player.scout_name || 'Unknown'}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/players/${player.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Player
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Player
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Player</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {player.full_name}? This will also delete all associated scouting reports.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePlayer(player.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    {filteredPlayers.length > 50 && (
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        Showing first 50 of {filteredPlayers.length} players. Use search to filter.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="card-glass">
              <CardContent className="pt-4 md:pt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reports found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.slice(0, 50).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{report.player_name}</p>
                            {report.overall_rating && (
                              <Badge variant="default" className="text-xs">
                                {report.overall_rating}/10
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(report.match_date), 'MMM d, yyyy')} · {report.competition_level.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Scout: {report.scout_name || 'Unknown'}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/reports/${report.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Report
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Report
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this scouting report for {report.player_name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteReport(report.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    {filteredReports.length > 50 && (
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        Showing first 50 of {filteredReports.length} reports. Use search to filter.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card className="card-glass">
              <CardContent className="pt-4 md:pt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No teams found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTeams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{team.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {team.member_count} members
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            Owner: {team.owner_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(new Date(team.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        
                        {isSuperAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Team</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {team.name}? All {team.member_count} members will be removed from the team.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTeam(team.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete Team
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
