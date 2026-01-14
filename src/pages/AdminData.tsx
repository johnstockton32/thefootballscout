import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, ShieldCheck, Trash2, ArrowLeft, Search, FileText, Crown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      // Fetch profiles for user details
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch players - filter by team if not super admin
      let playersQuery = supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && profile?.team_id) {
        // Get team member IDs
        const teamMemberIds = profiles?.filter(p => {
          // We need to check which profiles belong to the team
          return true; // Will filter after
        }).map(p => p.id) || [];
        
        // Fetch team member IDs
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
        // Regular admin with no team - show only their own data
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

      // Fetch reports with player names - apply same team filter
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

      // Fetch teams - only super admins can see all teams
      let teamsData: any[] = [];
      if (isSuperAdmin) {
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (teamsError) throw teamsError;
        teamsData = data || [];
      } else if (profile?.team_id) {
        // Regular admins can only see their own team
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', profile.team_id);
        
        if (teamsError) throw teamsError;
        teamsData = data || [];
      }

      // Get member counts
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
      // Delete reports first
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
      // Remove team_id from all members first
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary" />
                {isSuperAdmin ? 'Data Management' : 'Team Data Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSuperAdmin ? 'Manage players, reports, and teams' : 'Manage your team\'s players and reports'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="card-glass">
          <CardContent className="py-4">
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
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Players ({players.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Crown className="w-4 h-4" />
              Teams ({teams.length})
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="card-glass">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No players found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Scout</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.slice(0, 50).map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{player.position.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>{player.current_club || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{player.scout_name || 'Unknown'}</p>
                              <p className="text-muted-foreground text-xs">{player.scout_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(player.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/players/${player.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {filteredPlayers.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing first 50 of {filteredPlayers.length} players. Use search to filter.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="card-glass">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reports found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Match Date</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Scout</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.slice(0, 50).map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.player_name}</TableCell>
                          <TableCell>{format(new Date(report.match_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.competition_level.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            {report.overall_rating ? (
                              <Badge variant={report.overall_rating >= 7 ? 'default' : 'secondary'}>
                                {report.overall_rating.toFixed(1)}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{report.scout_name || 'Unknown'}</p>
                              <p className="text-muted-foreground text-xs">{report.scout_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/reports/${report.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this report for {report.player_name}?
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {filteredReports.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing first 50 of {filteredReports.length} reports. Use search to filter.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card className="card-glass">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No teams found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{team.owner_name || 'Unknown'}</p>
                              <p className="text-muted-foreground text-xs">{team.owner_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{team.member_count} members</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(team.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {team.name}? This will remove {team.member_count} members from the team (their data will be preserved).
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
