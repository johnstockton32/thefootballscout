import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase, POSITION_LABELS, PlayerPosition } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParsedPlayer {
  full_name: string;
  position: string;
  secondary_position?: string;
  date_of_birth?: string;
  nationality?: string;
  current_club?: string;
  height_cm?: number;
  weight_kg?: number;
  preferred_foot?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
  row: number;
}

const VALID_POSITIONS = Object.keys(POSITION_LABELS);
const VALID_FEET = ['right', 'left', 'both'];

const SAMPLE_CSV = `full_name,position,secondary_position,date_of_birth,nationality,current_club,height_cm,weight_kg,preferred_foot,notes
Marcus Johnson,striker,,2002-05-15,England,Manchester City U21,185,78,right,Promising young striker
Emma Williams,winger,attacking_midfielder,2001-08-22,Spain,Barcelona Femeni,168,58,left,Creative player with pace
David Chen,centre_back,defensive_midfielder,2000-03-10,China,Shanghai Port,192,85,right,Strong aerial presence`;

export function BulkCSVImport({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const { canCreatePlayer, usage, limits } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = limits.maxPlayers === Infinity 
    ? Infinity 
    : Math.max(0, limits.maxPlayers - usage.playerCount);

  const parseCSV = useCallback((content: string): ParsedPlayer[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const players: ParsedPlayer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const player: Record<string, string> = {};
      
      headers.forEach((header, idx) => {
        player[header] = values[idx]?.trim() || '';
      });

      const errors: string[] = [];
      
      // Validate required fields
      if (!player.full_name || player.full_name.length < 2) {
        errors.push('Name is required (min 2 characters)');
      }
      
      // Validate position
      const position = player.position?.toLowerCase().replace(/\s+/g, '_');
      if (!position || !VALID_POSITIONS.includes(position)) {
        errors.push(`Invalid position: ${player.position || 'missing'}`);
      }

      // Validate secondary position if provided
      let secondaryPosition = player.secondary_position?.toLowerCase().replace(/\s+/g, '_');
      if (secondaryPosition && !VALID_POSITIONS.includes(secondaryPosition)) {
        errors.push(`Invalid secondary position: ${player.secondary_position}`);
        secondaryPosition = undefined;
      }

      // Validate date format
      if (player.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(player.date_of_birth)) {
        errors.push('Invalid date format (use YYYY-MM-DD)');
      }

      // Validate height
      const height = player.height_cm ? parseInt(player.height_cm) : undefined;
      if (player.height_cm && (isNaN(height!) || height! < 100 || height! > 250)) {
        errors.push('Height must be between 100-250 cm');
      }

      // Validate weight
      const weight = player.weight_kg ? parseInt(player.weight_kg) : undefined;
      if (player.weight_kg && (isNaN(weight!) || weight! < 30 || weight! > 150)) {
        errors.push('Weight must be between 30-150 kg');
      }

      // Validate preferred foot
      const foot = player.preferred_foot?.toLowerCase();
      if (foot && !VALID_FEET.includes(foot)) {
        errors.push(`Invalid preferred foot: ${player.preferred_foot}`);
      }

      players.push({
        full_name: player.full_name || '',
        position: position || '',
        secondary_position: secondaryPosition,
        date_of_birth: player.date_of_birth || undefined,
        nationality: player.nationality || undefined,
        current_club: player.current_club || undefined,
        height_cm: height,
        weight_kg: weight,
        preferred_foot: foot,
        notes: player.notes || undefined,
        isValid: errors.length === 0,
        errors,
        row: i + 1,
      });
    }

    return players;
  }, []);

  // Handle CSV line parsing with quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const players = parseCSV(content);
      setParsedPlayers(players);
      setImportResults(null);
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const downloadSampleCSV = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_players.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to import players');
      return;
    }

    const validPlayers = parsedPlayers.filter(p => p.isValid);
    const playersToImport = remainingSlots === Infinity 
      ? validPlayers 
      : validPlayers.slice(0, remainingSlots);

    if (playersToImport.length === 0) {
      toast.error('No valid players to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < playersToImport.length; i++) {
      const player = playersToImport[i];
      
      try {
        const { error } = await supabase.from('players').insert({
          scout_id: user.id,
          full_name: player.full_name.trim(),
          position: player.position as PlayerPosition,
          secondary_position: player.secondary_position as PlayerPosition || null,
          date_of_birth: player.date_of_birth || null,
          nationality: player.nationality?.trim() || null,
          current_club: player.current_club?.trim() || null,
          height_cm: player.height_cm || null,
          weight_kg: player.weight_kg || null,
          preferred_foot: player.preferred_foot || null,
          notes: player.notes?.trim() || null,
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error('Error importing player:', error);
        failed++;
      }

      setImportProgress(((i + 1) / playersToImport.length) * 100);
    }

    setIsImporting(false);
    setImportResults({ success, failed });

    if (success > 0) {
      toast.success(`Successfully imported ${success} player${success !== 1 ? 's' : ''}`);
      onSuccess?.();
    }
    if (failed > 0) {
      toast.error(`Failed to import ${failed} player${failed !== 1 ? 's' : ''}`);
    }
  }, [user, parsedPlayers, remainingSlots, onSuccess]);

  const validCount = parsedPlayers.filter(p => p.isValid).length;
  const invalidCount = parsedPlayers.filter(p => !p.isValid).length;
  const importableCount = remainingSlots === Infinity 
    ? validCount 
    : Math.min(validCount, remainingSlots);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Import Players
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple players at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!parsedPlayers.length ? (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                )}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV files with player data
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Sample Download */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Need a template?</CardTitle>
                  <CardDescription>
                    Download our sample CSV to see the expected format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </CardContent>
              </Card>

              {/* Format Info */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> full_name, position<br />
                  <strong>Optional:</strong> secondary_position, date_of_birth (YYYY-MM-DD), nationality, current_club, height_cm, weight_kg, preferred_foot (right/left/both), notes<br />
                  <strong>Valid positions:</strong> goalkeeper, centre_back, full_back, defensive_midfielder, central_midfielder, attacking_midfielder, winger, striker
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-sm py-1 px-3">
                  Total: {parsedPlayers.length}
                </Badge>
                <Badge variant="default" className="text-sm py-1 px-3 bg-status-success">
                  <Check className="w-3 h-3 mr-1" />
                  Valid: {validCount}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="text-sm py-1 px-3">
                    <X className="w-3 h-3 mr-1" />
                    Invalid: {invalidCount}
                  </Badge>
                )}
                {remainingSlots !== Infinity && validCount > remainingSlots && (
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Limited to {remainingSlots} (subscription limit)
                  </Badge>
                )}
              </div>

              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Importing players... {Math.round(importProgress)}%
                  </p>
                </div>
              )}

              {/* Results */}
              {importResults && (
                <Alert className={importResults.failed > 0 ? 'border-status-warning' : 'border-status-success'}>
                  <AlertDescription>
                    <strong>Import complete:</strong> {importResults.success} succeeded, {importResults.failed} failed
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPlayers.map((player, idx) => (
                      <TableRow key={idx} className={!player.isValid ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs">{player.row}</TableCell>
                        <TableCell>
                          {player.isValid ? (
                            <Check className="w-4 h-4 text-status-success" />
                          ) : (
                            <X className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{player.full_name || '-'}</TableCell>
                        <TableCell>
                          {POSITION_LABELS[player.position as PlayerPosition] || player.position || '-'}
                        </TableCell>
                        <TableCell>{player.nationality || '-'}</TableCell>
                        <TableCell>{player.current_club || '-'}</TableCell>
                        <TableCell className="text-xs text-destructive">
                          {player.errors.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedPlayers([]);
                    setImportResults(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="hero"
                  onClick={handleImport}
                  disabled={isImporting || importableCount === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {importableCount} Player{importableCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
