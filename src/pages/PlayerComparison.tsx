import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase, PlayerPosition, POSITION_LABELS, POSITION_ABBREV, calculateAge } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Users, X, Plus, ArrowLeft, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  full_name: string;
  position: PlayerPosition;
  date_of_birth: string | null;
  nationality: string | null;
  current_club: string | null;
}

interface PlayerWithStats extends Player {
  avgRating: number | null;
  attributes: {
    passing: number;
    dribbling: number;
    shooting: number;
    positioning: number;
    awareness: number;
    pace: number;
    stamina: number;
    composure: number;
  };
}

const COLORS = [
  'hsl(158, 64%, 45%)', // primary green
  'hsl(38, 92%, 50%)',  // gold
  'hsl(280, 65%, 60%)', // purple
  'hsl(200, 80%, 50%)', // blue
  'hsl(340, 75%, 55%)', // pink
];

export default function PlayerComparison() {
  const { user } = useAuth();
  const { limits, tier } = useSubscription();
  const navigate = useNavigate();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  const maxComparison = limits.maxComparisonPlayers;

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setAllPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerStats = async (playerId: string): Promise<PlayerWithStats['attributes'] & { avgRating: number | null }> => {
    const { data: reports } = await supabase
      .from('scouting_reports')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_draft', false);

    if (!reports || reports.length === 0) {
      return {
        passing: 0,
        dribbling: 0,
        shooting: 0,
        positioning: 0,
        awareness: 0,
        pace: 0,
        stamina: 0,
        composure: 0,
        avgRating: null,
      };
    }

    const avg = (key: string) => {
      const values = reports.map((r: any) => r[key] as number | null).filter((v) => v !== null);
      return values.length > 0 ? values.reduce((a, b) => a + (b || 0), 0) / values.length : 0;
    };

    const avgRating = reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reports.length;

    return {
      passing: avg('technical_passing'),
      dribbling: avg('technical_dribbling'),
      shooting: avg('technical_shooting'),
      positioning: avg('tactical_positioning'),
      awareness: avg('tactical_awareness'),
      pace: avg('physical_pace'),
      stamina: avg('physical_stamina'),
      composure: avg('mental_composure'),
      avgRating: Math.round(avgRating),
    };
  };

  const addPlayer = async (player: Player) => {
    if (selectedPlayers.length >= maxComparison) {
      toast.error(`Maximum ${maxComparison} players can be compared on your plan`);
      return;
    }

    if (selectedPlayers.some((p) => p.id === player.id)) {
      toast.error('Player already added');
      return;
    }

    const stats = await fetchPlayerStats(player.id);
    
    setSelectedPlayers((prev) => [
      ...prev,
      {
        ...player,
        avgRating: stats.avgRating,
        attributes: {
          passing: stats.passing,
          dribbling: stats.dribbling,
          shooting: stats.shooting,
          positioning: stats.positioning,
          awareness: stats.awareness,
          pace: stats.pace,
          stamina: stats.stamina,
          composure: stats.composure,
        },
      },
    ]);
    setShowSelector(false);
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  const getRadarData = () => {
    if (selectedPlayers.length === 0) return null;

    const primaryPlayer = selectedPlayers[0];
    const data = [
      { attribute: 'Passing', value: primaryPlayer.attributes.passing, fullMark: 20 },
      { attribute: 'Dribbling', value: primaryPlayer.attributes.dribbling, fullMark: 20 },
      { attribute: 'Shooting', value: primaryPlayer.attributes.shooting, fullMark: 20 },
      { attribute: 'Positioning', value: primaryPlayer.attributes.positioning, fullMark: 20 },
      { attribute: 'Awareness', value: primaryPlayer.attributes.awareness, fullMark: 20 },
      { attribute: 'Pace', value: primaryPlayer.attributes.pace, fullMark: 20 },
      { attribute: 'Stamina', value: primaryPlayer.attributes.stamina, fullMark: 20 },
      { attribute: 'Composure', value: primaryPlayer.attributes.composure, fullMark: 20 },
    ];

    if (selectedPlayers.length === 2) {
      return {
        data,
        compareData: [
          { attribute: 'Passing', value: selectedPlayers[1].attributes.passing, fullMark: 20 },
          { attribute: 'Dribbling', value: selectedPlayers[1].attributes.dribbling, fullMark: 20 },
          { attribute: 'Shooting', value: selectedPlayers[1].attributes.shooting, fullMark: 20 },
          { attribute: 'Positioning', value: selectedPlayers[1].attributes.positioning, fullMark: 20 },
          { attribute: 'Awareness', value: selectedPlayers[1].attributes.awareness, fullMark: 20 },
          { attribute: 'Pace', value: selectedPlayers[1].attributes.pace, fullMark: 20 },
          { attribute: 'Stamina', value: selectedPlayers[1].attributes.stamina, fullMark: 20 },
          { attribute: 'Composure', value: selectedPlayers[1].attributes.composure, fullMark: 20 },
        ],
      };
    }

    return { data, compareData: undefined };
  };

  const radarResult = getRadarData();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Player Comparison</h1>
            <p className="text-muted-foreground mt-1">
              Compare up to {maxComparison} players side by side
            </p>
          </div>
        </div>

        {/* Upgrade notice for free tier */}
        {tier === 'free' && (
          <Alert className="border-primary/20 bg-primary/5">
            <Crown className="h-4 w-4" />
            <AlertTitle>Limited comparison</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Free plan allows comparing up to {maxComparison} players. Upgrade to Pro to compare up to 5.</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/pricing')} className="ml-4">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Players Bar */}
        <Card className="card-glass">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              {selectedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                  style={{ borderLeft: `4px solid ${COLORS[index]}` }}
                >
                  <span className="font-medium">{player.full_name}</span>
                  <Badge className="position-badge text-xs">
                    {POSITION_ABBREV[player.position]}
                  </Badge>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="ml-1 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedPlayers.length < maxComparison && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSelector(!showSelector)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Player
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player Selector */}
        {showSelector && (
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-lg">Select a Player</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {allPlayers
                    .filter((p) => !selectedPlayers.some((sp) => sp.id === p.id))
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() => addPlayer(player)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium">{player.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {POSITION_LABELS[player.position]} • {player.current_club || 'No club'}
                          </p>
                        </div>
                        <Badge className="position-badge">
                          {POSITION_ABBREV[player.position]}
                        </Badge>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Comparison Content */}
        {selectedPlayers.length >= 2 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="card-glass lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Attribute Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {radarResult && (
                  <AttributeRadarChart
                    data={radarResult.data}
                    color={COLORS[0]}
                    compareData={radarResult.compareData}
                    compareColor={COLORS[1]}
                    labels={{
                      primary: selectedPlayers[0]?.full_name,
                      compare: selectedPlayers[1]?.full_name,
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            {selectedPlayers.map((player, index) => (
              <Card
                key={player.id}
                className="card-glass"
                style={{ borderTop: `3px solid ${COLORS[index]}` }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{player.full_name}</CardTitle>
                    {player.avgRating && (
                      <div className="rating-badge-sm">{player.avgRating}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="position-badge">{POSITION_ABBREV[player.position]}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {player.date_of_birth ? `${calculateAge(player.date_of_birth)} yrs` : ''} 
                      {player.nationality ? ` • ${player.nationality}` : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(player.attributes).map(([attr, value]) => (
                      <div key={attr} className="flex items-center justify-between">
                        <span className="text-sm capitalize text-muted-foreground">{attr}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{ width: `${(value / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {Math.round(value * 10) / 10}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedPlayers.length === 1 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Add another player</h3>
            <p className="text-muted-foreground">
              Select at least 2 players to start comparing
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No players selected</h3>
            <p className="text-muted-foreground mb-6">
              Add 2-5 players to compare their attributes side by side
            </p>
            <Button variant="hero" onClick={() => setShowSelector(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Players
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
