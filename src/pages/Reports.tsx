import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase, CompetitionLevel, COMPETITION_LEVEL_LABELS, PlayerPosition, POSITION_ABBREV } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, Search, FileText, Calendar, Star } from 'lucide-react';

interface Report {
  id: string;
  match_date: string;
  opposition: string | null;
  competition_level: CompetitionLevel;
  overall_rating: number | null;
  is_draft: boolean;
  players: {
    id: string;
    full_name: string;
    position: PlayerPosition;
  };
}

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('scouting_reports')
        .select(`
          id,
          match_date,
          opposition,
          competition_level,
          overall_rating,
          is_draft,
          players (
            id,
            full_name,
            position
          )
        `)
        .order('match_date', { ascending: false });

      if (error) throw error;
      setReports(data as unknown as Report[] || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchQuery) {
      setFilteredReports(reports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (r) =>
        r.players?.full_name?.toLowerCase().includes(query) ||
        r.opposition?.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Scouting Reports</h1>
            <p className="text-muted-foreground mt-1">
              {reports.filter(r => !r.is_draft).length} submitted report{reports.filter(r => !r.is_draft).length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/reports/new">
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by player or opposition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input"
          />
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <Card className="card-glass hover:border-primary/30 transition-all duration-300 hover:scale-[1.01]">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Position Badge */}
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {report.players?.position ? POSITION_ABBREV[report.players.position] : '?'}
                          </span>
                        </div>

                        {/* Report Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold truncate">
                              {report.players?.full_name || 'Unknown Player'}
                            </h3>
                            {report.is_draft && (
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(report.match_date), 'MMM d, yyyy')}
                            </span>
                            {report.opposition && (
                              <span>vs {report.opposition}</span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                              {COMPETITION_LEVEL_LABELS[report.competition_level]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      {report.overall_rating && !report.is_draft && (
                        <div className="rating-badge-lg flex-shrink-0">
                          {Math.round(report.overall_rating)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">Try adjusting your search</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground mb-6">
              Start documenting your observations by creating your first scouting report
            </p>
            <Button variant="hero" asChild>
              <Link to="/reports/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Report
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
