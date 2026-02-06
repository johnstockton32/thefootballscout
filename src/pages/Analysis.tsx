import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerPhotoAvatar } from '@/components/players/PlayerPhotoAvatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Sparkles, Loader2, User, MapPin, Calendar, ArrowRight, 
  GitCompare, X, Download, FileText, FileSpreadsheet, Bookmark, 
  BookmarkPlus, Trash2, ChevronDown, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInYears, format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { POSITION_LABELS, PlayerPosition } from '@/lib/supabase';

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

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  created_at: string;
}

export default function Analysis() {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exampleQueries = [
    "Fast wingers under 23 with good dribbling",
    "Left-footed centre backs who are strong in the air",
    "Creative midfielders with high work rate",
  ];

  // Load saved searches on mount
  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    }
  }, [user]);

  const fetchSavedSearches = async () => {
    setIsLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim() || !query.trim()) {
      toast.error('Please enter a name for your search');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user?.id,
        name: searchName.trim(),
        query: query.trim(),
      });

      if (error) throw error;

      toast.success('Search saved successfully');
      setShowSaveDialog(false);
      setSearchName('');
      fetchSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Search deleted');
      fetchSavedSearches();
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleLoadSavedSearch = (savedQuery: string) => {
    setQuery(savedQuery);
  };

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
    
    const playerIds = Array.from(selectedForComparison);
    sessionStorage.setItem('comparePlayerIds', JSON.stringify(playerIds));
    navigate('/players/compare');
  };

  const clearSelection = () => {
    setSelectedForComparison(new Set());
    setIsCompareMode(false);
  };

  // Export as CSV
  const exportAsCSV = () => {
    if (!result?.players?.length) return;

    setIsExporting(true);
    try {
      const headers = ['Name', 'Position', 'Club', 'Nationality', 'Age', 'Match Score', 'Match Reason'];
      
      const rows = result.players.map(player => [
        player.full_name,
        POSITION_LABELS[player.position as PlayerPosition] || player.position,
        player.current_club || 'N/A',
        player.nationality || 'N/A',
        player.date_of_birth ? calculateAge(player.date_of_birth)?.toString() || 'N/A' : 'N/A',
        `${Math.round(player.match_score * 100)}%`,
        player.match_reason?.replace(/[\n\r]/g, ' ') || '',
      ]);

      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart_discovery_results_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Exported as CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as PDF
  const exportAsPDF = () => {
    if (!result?.players?.length) return;

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [39, 174, 96];
      const textDark: [number, number, number] = [30, 30, 30];
      const textMuted: [number, number, number] = [107, 114, 128];
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SMART DISCOVERY RESULTS', 15, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`The Football Scout  •  ${format(new Date(), 'MMMM d, yyyy')}`, 15, 27);
      
      // Search query info
      let y = 45;
      doc.setTextColor(...textMuted);
      doc.setFontSize(10);
      doc.text('Search Query:', 15, y);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      
      // Word wrap for long queries
      const queryLines = doc.splitTextToSize(query, 180);
      doc.text(queryLines, 15, y + 6);
      y += 6 + queryLines.length * 5;
      
      // Summary
      if (result.summary) {
        y += 5;
        doc.setTextColor(...textMuted);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(result.summary, 180);
        doc.text(summaryLines, 15, y);
        y += summaryLines.length * 4 + 5;
      }
      
      // Results count
      y += 5;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${result.players.length} Matching Players`, 15, y);
      y += 8;
      
      // Table
      autoTable(doc, {
        startY: y,
        head: [['Name', 'Position', 'Club', 'Nationality', 'Age', 'Match']],
        body: result.players.map(player => [
          player.full_name,
          getPositionLabel(player.position),
          player.current_club || 'N/A',
          player.nationality || 'N/A',
          player.date_of_birth ? calculateAge(player.date_of_birth)?.toString() || '-' : '-',
          `${Math.round(player.match_score * 100)}%`,
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: textDark,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 35 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
        },
      });
      
      // Save PDF
      doc.save(`smart_discovery_results_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Exported as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  if (!limits.hasSmartDiscovery) {
    return (
      <SubscriptionGate
        requiredTier="pro"
        feature="hasSmartDiscovery"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              Smart Discovery
            </h1>
            <p className="text-muted-foreground mt-1">
              Search your player database using natural language.
            </p>
          </div>
          
          {/* Saved Searches Dropdown */}
          {savedSearches.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved Searches
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <ScrollArea className="max-h-64">
                  {savedSearches.map((search) => (
                    <DropdownMenuItem
                      key={search.id}
                      className="flex items-center justify-between p-2"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <button
                        onClick={() => handleLoadSavedSearch(search.query)}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium text-sm truncate">{search.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(search.created_at), 'MMM d, yyyy')}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedSearch(search.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !query.trim()}
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
              
              {query.trim() && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Save Search
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Search</DialogTitle>
                      <DialogDescription>
                        Give your search a name so you can quickly access it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Search Name</label>
                        <Input
                          placeholder="e.g., Young wingers for U23 team"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Query</label>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {query}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSearch} disabled={isSaving || !searchName.trim()}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Search'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Export buttons */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" disabled={isExporting}>
                            {isExporting ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-1" />
                            )}
                            Export
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={exportAsPDF}>
                            <FileText className="w-4 h-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportAsCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export as CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
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
                            <PlayerPhotoAvatar
                              photoUrl={player.photo_url}
                              playerName={player.full_name}
                              className="h-12 w-12 shrink-0"
                            />
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
