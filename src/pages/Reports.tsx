import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, CompetitionLevel, COMPETITION_LEVEL_LABELS, PlayerPosition, POSITION_ABBREV } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, Search, FileText, Calendar, ArrowLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  match_date: string;
  opposition: string | null;
  competition_level: CompetitionLevel;
  overall_rating: number | null;
  recommendation: string | null;
  is_draft: boolean;
  players: {
    id: string;
    full_name: string;
    position: PlayerPosition;
  };
}

const reportRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    x: 4,
    transition: { duration: 0.15 },
  },
};

const getRecommendationColor = (rec: string | null) => {
  switch (rec) {
    case 'Sign': return 'bg-primary text-primary-foreground';
    case 'Monitor': return 'bg-amber-500 text-white';
    case 'Reject': return 'bg-destructive text-destructive-foreground';
    default: return '';
  }
};

export default function Reports() {
  const navigate = useNavigate();
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
          recommendation,
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
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm">Back</span>
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Scouting Reports</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {reports.filter(r => !r.is_draft).length} submitted report{reports.filter(r => !r.is_draft).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link to="/reports/analytics">
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Analytics</span>
                <span className="xs:hidden">Stats</span>
              </Link>
            </Button>
            <Button variant="hero" asChild className="flex-1 sm:flex-none">
              <Link to="/reports/new">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Report</span>
                <span className="xs:hidden">New</span>
              </Link>
            </Button>
          </div>
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
          <div className="space-y-3">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                custom={index}
                variants={reportRowVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Link to={`/reports/${report.id}`}>
                  <Card className="card-glass hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-4 md:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {/* Position Badge */}
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {report.players?.position ? POSITION_ABBREV[report.players.position] : '?'}
                            </span>
                          </div>

                          {/* Report Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
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

                        {/* Rating & Recommendation */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {report.recommendation && !report.is_draft && (
                            <Badge className={getRecommendationColor(report.recommendation)}>
                              {report.recommendation}
                            </Badge>
                          )}
                          {report.overall_rating && !report.is_draft && (
                            <div className="rating-badge-lg">
                              {Math.round(report.overall_rating)}
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
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
