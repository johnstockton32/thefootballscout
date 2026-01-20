import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SwipeableReportCard } from '@/components/reports/SwipeableReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOfflineReports, ReportWithPlayer } from '@/hooks/useOfflineReports';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Plus, Search, FileText, ArrowLeft, BarChart3, WifiOff } from 'lucide-react';

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

export default function Reports() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { reports, isLoading, isOnline, deleteReport, refetch } = useOfflineReports();
  const [filteredReports, setFilteredReports] = useState<ReportWithPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!searchQuery) {
      setFilteredReports(reports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (r) =>
        r.players?.full_name?.toLowerCase().includes(query) ||
        r.opposition?.toLowerCase().includes(query) ||
        r.recommendation?.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  }, [reports, searchQuery]);

  const handleDeleteReport = async (reportId: string) => {
    try {
      const success = await deleteReport(reportId);
      if (success) {
        toast.success('Report deleted');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 text-sm">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>You're offline. Showing cached data.</span>
          </div>
        )}

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

        {/* Mobile swipe hint */}
        {isMobile && filteredReports.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Swipe left on a report to delete
          </p>
        )}

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
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
                whileHover={!isMobile ? "hover" : undefined}
              >
                <SwipeableReportCard 
                  report={report} 
                  onDelete={handleDeleteReport}
                />
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
