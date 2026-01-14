import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Report {
  match_date: string;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_first_touch: number | null;
  technical_passing: number | null;
  technical_dribbling: number | null;
  technical_shooting: number | null;
  tactical_positioning: number | null;
  tactical_awareness: number | null;
  physical_pace: number | null;
  physical_stamina: number | null;
  mental_composure: number | null;
  mental_work_rate: number | null;
}

interface PlayerTrendChartProps {
  reports: Report[];
  className?: string;
}

export function PlayerTrendChart({ reports, className }: PlayerTrendChartProps) {
  const chartData = useMemo(() => {
    if (reports.length === 0) return [];

    // Sort by date ascending
    const sorted = [...reports].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );

    return sorted.map((report) => {
      // Calculate category averages
      const technical = [
        report.technical_first_touch,
        report.technical_passing,
        report.technical_dribbling,
        report.technical_shooting,
      ].filter(Boolean) as number[];

      const tactical = [
        report.tactical_positioning,
        report.tactical_awareness,
      ].filter(Boolean) as number[];

      const physical = [
        report.physical_pace,
        report.physical_stamina,
      ].filter(Boolean) as number[];

      const mental = [
        report.mental_composure,
        report.mental_work_rate,
      ].filter(Boolean) as number[];

      return {
        date: format(new Date(report.match_date), 'MMM d'),
        fullDate: report.match_date,
        overall: report.overall_rating,
        potential: report.potential_rating,
        technical: technical.length ? +(technical.reduce((a, b) => a + b, 0) / technical.length).toFixed(1) : null,
        tactical: tactical.length ? +(tactical.reduce((a, b) => a + b, 0) / tactical.length).toFixed(1) : null,
        physical: physical.length ? +(physical.reduce((a, b) => a + b, 0) / physical.length).toFixed(1) : null,
        mental: mental.length ? +(mental.reduce((a, b) => a + b, 0) / mental.length).toFixed(1) : null,
      };
    });
  }, [reports]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstOverall = chartData[0].overall;
    const lastOverall = chartData[chartData.length - 1].overall;
    if (firstOverall === null || lastOverall === null) return null;
    const diff = lastOverall - firstOverall;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      value: Math.abs(diff).toFixed(1),
    };
  }, [chartData]);

  if (reports.length < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Need at least 2 reports to show trends</p>
            <p className="text-sm mt-1">Current reports: {reports.length}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Performance Trends</CardTitle>
        {trend && (
          <Badge 
            variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.value}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 20]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="technical"
                name="Technical"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="tactical"
                name="Tactical"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="physical"
                name="Physical"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="mental"
                name="Mental"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
