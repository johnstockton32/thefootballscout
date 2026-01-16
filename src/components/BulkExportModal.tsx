import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, Users, Loader2 } from 'lucide-react';
import { exportPlayersCSV, exportReportsCSV } from '@/lib/export';

export function BulkExportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportPlayersCSV = async () => {
    setExporting('players-csv');
    try {
      await exportPlayersCSV();
      toast.success('Players exported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export players');
    } finally {
      setExporting(null);
    }
  };

  const handleExportReportsCSV = async () => {
    setExporting('reports-csv');
    try {
      await exportReportsCSV();
      toast.success('Reports exported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export reports');
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Bulk Export
          </DialogTitle>
          <DialogDescription>
            Export all your scouting data for backup or analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Players Export */}
          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Players Database
              </CardTitle>
              <CardDescription className="text-sm">
                Export all player profiles including details, positions, and notes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPlayersCSV}
                  disabled={exporting !== null}
                >
                  {exporting === 'players-csv' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
                <Badge variant="secondary" className="text-xs">
                  All fields
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reports Export */}
          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Scouting Reports
              </CardTitle>
              <CardDescription className="text-sm">
                Export all scouting reports with ratings and observations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportReportsCSV}
                  disabled={exporting !== null}
                >
                  {exporting === 'reports-csv' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
                <Badge variant="secondary" className="text-xs">
                  All attributes
                </Badge>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            For individual report PDFs, use the export button on each report detail page
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
