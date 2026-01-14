import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIInsights, InsightType } from '@/hooks/useAIInsights';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText,
  Save,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsPanelProps {
  player: {
    id: string;
    full_name: string;
    position: string;
    current_club: string | null;
    nationality: string | null;
    date_of_birth: string | null;
  };
  reports: any[];
  className?: string;
}

const insightTypes: { type: InsightType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" />, description: 'Executive overview' },
  { type: 'development', label: 'Development', icon: <TrendingUp className="w-4 h-4" />, description: 'Training plan' },
  { type: 'comparison', label: 'Comparison', icon: <Users className="w-4 h-4" />, description: 'Pro player comps' },
  { type: 'transfer', label: 'Transfer', icon: <DollarSign className="w-4 h-4" />, description: 'Market analysis' },
];

export function AIInsightsPanel({ player, reports, className }: AIInsightsPanelProps) {
  const { user } = useAuth();
  const { isLoading, insight, generateInsight, saveInsight, clearInsight } = useAIInsights();
  const [selectedType, setSelectedType] = useState<InsightType>('summary');
  const [lastType, setLastType] = useState<InsightType | null>(null);

  const handleGenerate = async () => {
    setLastType(selectedType);
    await generateInsight(player, reports, selectedType);
  };

  const handleSave = async () => {
    if (!insight || !user || !lastType) return;
    await saveInsight(player.id, null, user.id, lastType, insight);
  };

  return (
    <Card className={cn("card-glass", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Insights
          <Badge variant="secondary" className="ml-auto text-xs">
            Powered by AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insight Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          {insightTypes.map(({ type, label, icon, description }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                selectedType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted"
              )}
            >
              {icon}
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || reports.length === 0}
          className="w-full"
          variant="hero"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {insightTypes.find(t => t.type === selectedType)?.label} Insight
            </>
          )}
        </Button>

        {reports.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Add scouting reports to enable AI analysis
          </p>
        )}

        {/* Insight Display */}
        {insight && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {insightTypes.find(t => t.type === lastType)?.label}
                </Badge>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm whitespace-pre-wrap">{insight}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={clearInsight}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
