import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Sparkles, Loader2, User, MapPin, Calendar, ArrowRight, GitCompare, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInYears } from 'date-fns';

interface PlayerMatch {
  id: string;
  full_name: string;
  position: string;
  current_club: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  match_reason: string;
  match_score: number;
}

interface SearchResult {
  players: PlayerMatch[];
  summary: string;
}

export default function Analysis() {
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [isCompareMode, setIsCompareMode] = useState(false);

  const exampleQueries = [
    "Fast wingers under 23 with good dribbling",
    "Left-footed centre backs who are strong in the air",
    "Creative midfielders with high work rate",
    "Strikers who scored in their last 3 reports",
    "Young goalkeepers from Premier League clubs",
  ];

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSelectedForComparison(new Set());
    setIsCompareMode(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('smart-discovery', {
        body: { query: query.trim() }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits exhausted. Please contact support.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      if (data?.players?.length === 0) {
        toast.info('No players found matching your criteria');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search players. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      goalkeeper: 'GK',
      centre_back: 'CB',
      full_back: 'FB',
      defensive_midfielder: 'DM',
      central_midfielder: 'CM',
      attacking_midfielder: 'AM',
      winger: 'W',
      striker: 'ST',
    };
    return labels[position] || position;
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    return differenceInYears(new Date(), new Date(dob));
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedForComparison(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        if (newSet.size >= limits.maxComparisonPlayers) {
          toast.error(`Maximum ${limits.maxComparisonPlayers} players can be compared on your plan`);
          return prev;
        }
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleCompareSelected = () => {
    if (selectedForComparison.size < 2) {
      toast.error('Please select at least 2 players to compare');
      return;
    }
    
    // Store selected player IDs in sessionStorage for the comparison page
    const playerIds = Array.from(selectedForComparison);
    sessionStorage.setItem('comparePlayerIds', JSON.stringify(playerIds));
    navigate('/players/compare');
  };

  const clearSelection = () => {
    setSelectedForComparison(new Set());
    setIsCompareMode(false);
  };

  if (!limits.hasAdvancedAnalytics) {
    return (
      <SubscriptionGate
        requiredTier="pro"
        feature="hasAdvancedAnalytics"
        featureName="Smart Discovery"
        featureDescription="Search your player database using natural language. Upgrade to Pro or Team to access AI-powered player discovery."
      >
        <div />
      </SubscriptionGate>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Smart Discovery
          </h1>
          <p className="text-muted-foreground mt-1">
            Search your player database using natural language. Just describe what you're looking for.
          </p>
        </div>

        {/* Search Card */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              AI-Powered Search
            </CardTitle>
            <CardDescription>
              Describe the type of player you're looking for in plain English
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g., Fast wingers under 23 with good dribbling skills who play in the Premier League..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSearch();
                }
              }}
            />
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleQueries.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(example)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !query.trim()}
              className="w-full sm:w-auto"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Search Players
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            {result.summary && (
              <Card className="card-glass border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{result.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player Results */}
            {result.players.length > 0 && (
              <Card className="card-glass">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle>Matching Players ({result.players.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      {isCompareMode ? (
                        <>
                          <span className="text-sm text-muted-foreground">
                            {selectedForComparison.size} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearSelection}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCompareSelected}
                            disabled={selectedForComparison.size < 2}
                          >
                            <GitCompare className="w-4 h-4 mr-1" />
                            Compare ({selectedForComparison.size})
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCompareMode(true)}
                          disabled={result.players.length < 2}
                        >
                          <GitCompare className="w-4 h-4 mr-1" />
                          Select to Compare
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 border transition-colors group ${
                          selectedForComparison.has(player.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {isCompareMode && (
                            <Checkbox
                              checked={selectedForComparison.has(player.id)}
                              onCheckedChange={() => togglePlayerSelection(player.id)}
                              className="shrink-0"
                            />
                          )}
                          <Link 
                            to={`/players/${player.id}`}
                            className="flex items-center gap-4 flex-1 min-w-0"
                            onClick={(e) => {
                              if (isCompareMode) {
                                e.preventDefault();
                                togglePlayerSelection(player.id);
                              }
                            }}
                          >
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={player.photo_url || undefined} />
                              <AvatarFallback>
                                <User className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">{player.full_name}</span>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {getPositionLabel(player.position)}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0"
                                >
                                  {Math.round(player.match_score * 100)}% match
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                                {player.current_club && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {player.current_club}
                                  </span>
                                )}
                                {player.date_of_birth && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {calculateAge(player.date_of_birth)} years
                                  </span>
                                )}
                                {player.nationality && (
                                  <span>{player.nationality}</span>
                                )}
                              </div>
                              {player.match_reason && (
                                <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                  "{player.match_reason}"
                                </p>
                              )}
                            </div>
                          </Link>
                        </div>
                        {!isCompareMode && (
                          <Link to={`/players/${player.id}`}>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {result.players.length === 0 && (
              <Card className="card-glass">
                <CardContent className="py-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Players Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search criteria or add more players to your database.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
