import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';
import {
  Users,
  FileText,
  BarChart3,
  Star,
  Target,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle,
  Footprints,
  Ruler,
  Clock,
  Trophy,
  Eye,
  ThumbsUp,
  AlertCircle,
  ChevronRight,
  Download,
  Sparkles,
  Search,
  Play,
  LayoutDashboard,
  Crown,
  Building2,
  Plus,
  Filter,
  GitCompare,
  Mic,
  Brain,
  PieChart,
  Activity,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
  hover: { y: -8, scale: 1.02, transition: { duration: 0.2 } },
};

const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

// Demo data
const demoPlayers = [
  {
    id: '1',
    name: 'Marcus Johnson',
    position: 'ST',
    positionFull: 'Striker',
    age: 19,
    nationality: 'England',
    club: 'Manchester City U21',
    rating: 82,
    potential: 89,
    height: 185,
    weight: 78,
    preferredFoot: 'Right',
    attributes: {
      technical: { passing: 16, dribbling: 18, shooting: 17, firstTouch: 16, crossing: 14, heading: 15 },
      tactical: { positioning: 15, awareness: 14, decisionMaking: 15, offBallMovement: 17, defensiveContribution: 10 },
      physical: { pace: 19, stamina: 16, strength: 14, agility: 17, balance: 15 },
      mental: { composure: 15, concentration: 14, aggression: 13, workRate: 16, leadership: 12 },
    },
    strengths: 'Electric pace, clinical finishing in the box, excellent off-ball movement',
    weaknesses: 'Defensive work rate, aerial duels against physical defenders',
  },
  {
    id: '2',
    name: 'André Silva',
    position: 'CM',
    positionFull: 'Central Midfielder',
    age: 21,
    nationality: 'Portugal',
    club: 'Sporting CP B',
    rating: 78,
    potential: 85,
    height: 178,
    weight: 72,
    preferredFoot: 'Left',
    attributes: {
      technical: { passing: 17, dribbling: 14, shooting: 12, firstTouch: 16, crossing: 13, heading: 11 },
      tactical: { positioning: 18, awareness: 17, decisionMaking: 16, offBallMovement: 14, defensiveContribution: 16 },
      physical: { pace: 15, stamina: 18, strength: 14, agility: 15, balance: 16 },
      mental: { composure: 16, concentration: 17, aggression: 14, workRate: 18, leadership: 15 },
    },
    strengths: 'Exceptional vision and passing range, tireless work rate, tactical intelligence',
    weaknesses: 'Lacks top-end pace, shooting from distance needs improvement',
  },
  {
    id: '3',
    name: 'Kenji Tanaka',
    position: 'CB',
    positionFull: 'Centre Back',
    age: 18,
    nationality: 'Japan',
    club: 'Yokohama Academy',
    rating: 75,
    potential: 84,
    height: 188,
    weight: 82,
    preferredFoot: 'Right',
    attributes: {
      technical: { passing: 14, dribbling: 11, shooting: 8, firstTouch: 13, crossing: 10, heading: 17 },
      tactical: { positioning: 16, awareness: 15, decisionMaking: 14, offBallMovement: 12, defensiveContribution: 18 },
      physical: { pace: 14, stamina: 15, strength: 17, agility: 13, balance: 14 },
      mental: { composure: 15, concentration: 16, aggression: 16, workRate: 15, leadership: 14 },
    },
    strengths: 'Commanding aerial presence, strong in the tackle, reads the game well',
    weaknesses: 'Distribution under pressure, recovery pace against fast forwards',
  },
];

type DemoPlayer = typeof demoPlayers[0];

const demoReports = [
  {
    id: '1',
    playerName: 'Marcus Johnson',
    position: 'ST',
    club: 'Manchester City U21',
    date: 'Jan 10, 2026',
    opposition: 'Liverpool U21',
    competition: 'PL2',
    competitionLevel: 'Youth Academy',
    minutesObserved: 90,
    rating: 85,
    potential: 89,
    recommendation: 'Sign',
    attributes: {
      technical: { passing: 16, dribbling: 19, shooting: 18, firstTouch: 17, crossing: 14, heading: 15 },
      tactical: { positioning: 16, awareness: 15, decisionMaking: 16, offBallMovement: 18, defensiveContribution: 11 },
      physical: { pace: 19, stamina: 17, strength: 14, agility: 18, balance: 16 },
      mental: { composure: 16, concentration: 15, aggression: 14, workRate: 17, leadership: 13 },
    },
    strengths: 'Outstanding performance. Two goals and an assist. Electric pace caused problems all game.',
    weaknesses: 'Still needs to work on hold-up play and aerial duels.',
    matchNotes: 'Dominant display against a strong Liverpool U21 side. Ready for first-team consideration.',
  },
  {
    id: '2',
    playerName: 'André Silva',
    position: 'CM',
    club: 'Sporting CP B',
    date: 'Jan 8, 2026',
    opposition: 'Benfica B',
    competition: 'Liga Portugal 2',
    competitionLevel: 'Semi-Pro',
    minutesObserved: 75,
    rating: 79,
    potential: 85,
    recommendation: 'Monitor',
    attributes: {
      technical: { passing: 18, dribbling: 14, shooting: 13, firstTouch: 16, crossing: 14, heading: 11 },
      tactical: { positioning: 18, awareness: 17, decisionMaking: 17, offBallMovement: 15, defensiveContribution: 17 },
      physical: { pace: 15, stamina: 18, strength: 14, agility: 15, balance: 16 },
      mental: { composure: 17, concentration: 18, aggression: 14, workRate: 19, leadership: 16 },
    },
    strengths: 'Controlled the tempo exceptionally. Passing range was outstanding, completed 92% of passes.',
    weaknesses: 'Missed a clear shooting opportunity. Could be more aggressive in the final third.',
    matchNotes: 'Solid all-round performance in a tight derby match. Shows leadership qualities.',
  },
  {
    id: '3',
    playerName: 'Kenji Tanaka',
    position: 'CB',
    club: 'Yokohama Academy',
    date: 'Jan 5, 2026',
    opposition: 'Kawasaki Frontale',
    competition: 'J.League Cup',
    competitionLevel: 'Professional',
    minutesObserved: 90,
    rating: 77,
    potential: 84,
    recommendation: 'Monitor',
    attributes: {
      technical: { passing: 14, dribbling: 11, shooting: 8, firstTouch: 14, crossing: 10, heading: 18 },
      tactical: { positioning: 17, awareness: 16, decisionMaking: 15, offBallMovement: 13, defensiveContribution: 19 },
      physical: { pace: 14, stamina: 16, strength: 18, agility: 13, balance: 15 },
      mental: { composure: 16, concentration: 17, aggression: 17, workRate: 16, leadership: 15 },
    },
    strengths: 'Won all aerial duels (7/7). Strong in the tackle and read the game superbly.',
    weaknesses: 'Struggled with pace when isolated 1v1. Distribution under pressure needs work.',
    matchNotes: 'Impressive debut against senior opposition. One to watch for European scouts.',
  },
];

type DemoReport = typeof demoReports[0];

const radarData = [
  { attribute: 'Passing', value: 16, fullMark: 20 },
  { attribute: 'Dribbling', value: 18, fullMark: 20 },
  { attribute: 'Shooting', value: 17, fullMark: 20 },
  { attribute: 'Positioning', value: 15, fullMark: 20 },
  { attribute: 'Awareness', value: 14, fullMark: 20 },
  { attribute: 'Pace', value: 19, fullMark: 20 },
  { attribute: 'Stamina', value: 16, fullMark: 20 },
  { attribute: 'Composure', value: 15, fullMark: 20 },
];

const compareData = [
  { attribute: 'Passing', value: 17, fullMark: 20 },
  { attribute: 'Dribbling', value: 14, fullMark: 20 },
  { attribute: 'Shooting', value: 12, fullMark: 20 },
  { attribute: 'Positioning', value: 18, fullMark: 20 },
  { attribute: 'Awareness', value: 17, fullMark: 20 },
  { attribute: 'Pace', value: 15, fullMark: 20 },
  { attribute: 'Stamina', value: 18, fullMark: 20 },
  { attribute: 'Composure', value: 16, fullMark: 20 },
];

const features = [
  { icon: Users, title: 'Player Database', description: 'Manage comprehensive player profiles with photos, stats, and personal details.' },
  { icon: FileText, title: 'Scouting Reports', description: 'Create detailed match reports with 20+ attribute ratings across 4 categories.' },
  { icon: BarChart3, title: 'Player Comparison', description: 'Compare 2-5 players side-by-side with visual radar charts.' },
  { icon: Sparkles, title: 'AI Smart Discovery', description: 'Search players using natural language powered by AI.' },
  { icon: Shield, title: 'GDPR Compliant', description: 'Built with data protection and consent management from the ground up.' },
  { icon: Download, title: 'Export & Reports', description: 'Export data to CSV and generate professional PDF scouting reports.' },
];

// Helper component for attribute bars
function AttributeBar({ name, value }: { name: string; value: number }) {
  const percentage = (value / 20) * 100;
  const getColorClass = () => {
    if (value >= 17) return 'bg-primary';
    if (value >= 14) return 'bg-amber-500';
    if (value >= 11) return 'bg-muted-foreground';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full rounded-full ${getColorClass()}`}
        />
      </div>
      <span className="text-sm font-medium w-6 text-right">{value}</span>
    </div>
  );
}

// Demo Dashboard Component
function DemoDashboard() {
  const stats = { totalPlayers: 47, totalReports: 128, avgRating: 76.3, thisMonth: 12 };
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">JS</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">Welcome back, John!</h2>
          <p className="text-muted-foreground">Here's your scouting overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Players', value: stats.totalPlayers, icon: Users, variant: 'primary' },
          { title: 'Reports Filed', value: stats.totalReports, icon: FileText, variant: 'default' },
          { title: 'Avg Rating', value: stats.avgRating, icon: Star, variant: 'gold' },
          { title: 'This Month', value: stats.thisMonth, icon: TrendingUp, variant: 'default' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`card-glass hover:border-primary/30 transition-all cursor-pointer ${stat.variant === 'primary' ? 'border-l-4 border-l-primary' : stat.variant === 'gold' ? 'border-l-4 border-l-amber-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.variant === 'primary' ? 'bg-primary/10' : stat.variant === 'gold' ? 'bg-amber-500/10' : 'bg-muted'}`}>
                    <stat.icon className={`w-5 h-5 ${stat.variant === 'primary' ? 'text-primary' : stat.variant === 'gold' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Subscription Card */}
      <Card className="card-glass border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Pro Plan</h3>
                  <Badge variant="secondary" className="text-xs">Trial • 7d left</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Enjoying unlimited scouting features</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">47<span className="text-sm font-normal text-muted-foreground">/∞</span></div>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">12<span className="text-sm font-normal text-muted-foreground">/∞</span></div>
                <p className="text-xs text-muted-foreground">Reports/mo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Players</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">View All <ChevronRight className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoPlayers.slice(0, 2).map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.positionFull} • {player.club}</p>
                  </div>
                </div>
                <Badge className="position-badge">{player.position}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Reports</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">View All <ChevronRight className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoReports.slice(0, 2).map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{report.playerName}</p>
                    <p className="text-sm text-muted-foreground">{report.date} • vs {report.opposition}</p>
                  </div>
                </div>
                <div className="rating-badge-sm">{report.rating}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Demo AI Discovery Component
function DemoAIDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1500);
  };

  const exampleQueries = [
    "Fast wingers under 23 with good dribbling",
    "Left-footed centre backs who are strong in the air",
    "Creative midfielders with high work rate",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Smart Discovery</h2>
          <p className="text-muted-foreground">Search your player database using natural language</p>
        </div>
      </div>

      {/* Search Card */}
      <Card className="card-glass">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="e.g., Fast wingers under 23 with good dribbling skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((query, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(query); setShowResults(false); }}
                className="text-xs"
              >
                {query}
              </Button>
            ))}
          </div>
          <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching} className="w-full gap-2">
            {isSearching ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Brain className="w-4 h-4" />
                </motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Search with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">3 Matching Players</h3>
              <Badge variant="secondary" className="gap-1">
                <Brain className="w-3 h-3" />
                AI Powered
              </Badge>
            </div>
            {demoPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-glass hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{player.name}</h4>
                            <Badge className="position-badge text-xs">{player.position}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{player.club} • {player.nationality}</p>
                          <p className="text-xs text-primary mt-1">
                            {i === 0 ? '95% match - Exceptional pace and dribbling' : i === 1 ? '87% match - Creative with high work rate' : '82% match - Strong aerial presence'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Rating</p>
                          <p className="text-xl font-bold text-primary">{player.rating}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Demo Analytics Component
function DemoAnalytics() {
  const monthlyData = [
    { month: 'Aug', reports: 8 },
    { month: 'Sep', reports: 12 },
    { month: 'Oct', reports: 15 },
    { month: 'Nov', reports: 11 },
    { month: 'Dec', reports: 18 },
    { month: 'Jan', reports: 14 },
  ];

  const positionBreakdown = [
    { position: 'Strikers', count: 15, color: 'bg-primary' },
    { position: 'Midfielders', count: 22, color: 'bg-amber-500' },
    { position: 'Defenders', count: 18, color: 'bg-purple-500' },
    { position: 'Goalkeepers', count: 5, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <PieChart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your scouting activity and insights</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: 78, change: '+12%', icon: FileText },
          { label: 'Avg Rating', value: 76.3, change: '+2.1', icon: Star },
          { label: 'Sign Recommendations', value: 23, change: '+5', icon: ThumbsUp },
          { label: 'Players Tracked', value: 47, change: '+8', icon: Users },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs text-primary font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Monthly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {monthlyData.map((data, i) => (
                <motion.div
                  key={data.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.reports / 20) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full bg-primary rounded-t-md" style={{ height: '100%' }} />
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Position Breakdown */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Position Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {positionBreakdown.map((pos, i) => (
              <motion.div
                key={pos.position}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span>{pos.position}</span>
                  <span className="font-medium">{pos.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(pos.count / 22) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${pos.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Demo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<DemoPlayer | null>(null);
  const [selectedReport, setSelectedReport] = useState<DemoReport | null>(null);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Sign': return 'bg-primary text-primary-foreground';
      case 'Monitor': return 'bg-amber-500 text-white';
      case 'Reject': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const demoTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'discovery', label: 'AI Discovery', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex gap-1">
              <Play className="w-3 h-3" />
              Interactive Demo
            </Badge>
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/install">
                <Download className="w-4 h-4 mr-1" />
                Install
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto text-center max-w-3xl">
          <Badge variant="outline" className="mb-4 gap-1">
            <Star className="w-3 h-3" />
            Fully Interactive Demo
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Explore The{' '}
            <span className="text-gradient-gold">Football Scout</span>{' '}
            Platform
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Click through each section to experience how professional scouts manage players, 
            create reports, and discover talent with AI.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureCardVariants}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true }}
              >
                <Card className="card-glass h-full text-center">
                  <CardContent className="pt-4 pb-3 px-3">
                    <motion.div 
                      className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="card-glass overflow-hidden">
            {/* App Header Simulation */}
            <div className="bg-card border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <span className="text-sm font-medium hidden sm:inline">The Football Scout</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">JS</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border overflow-x-auto">
              <div className="flex p-2 gap-1 min-w-max">
                {demoTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2 shrink-0"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <CardContent className="p-4 md:p-6 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'dashboard' && <DemoDashboard />}
                  
                  {activeTab === 'players' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold">Players</h2>
                          <p className="text-muted-foreground">3 players in your database</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="w-4 h-4" />
                            Filter
                          </Button>
                          <Button variant="hero" size="sm" className="gap-1">
                            <Plus className="w-4 h-4" />
                            Add Player
                          </Button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        {demoPlayers.map((player, index) => (
                          <motion.div
                            key={player.id}
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            onClick={() => setSelectedPlayer(player)}
                            className="cursor-pointer"
                          >
                            <Card className="card-glass hover:border-primary/50 transition-colors h-full">
                              <CardContent className="pt-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary" />
                                  </div>
                                  <Badge className="position-badge">{player.position}</Badge>
                                </div>
                                <h3 className="text-lg font-semibold mb-1">{player.name}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{player.club}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {player.age} yrs
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {player.nationality}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Rating</p>
                                    <p className="text-lg font-bold text-primary">{player.rating}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Potential</p>
                                    <p className="text-lg font-bold text-gradient-gold">{player.potential}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold">Scouting Reports</h2>
                          <p className="text-muted-foreground">3 submitted reports</p>
                        </div>
                        <Button variant="hero" size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          New Report
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {demoReports.map((report, index) => (
                          <motion.div
                            key={report.id}
                            custom={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 4 }}
                            onClick={() => setSelectedReport(report)}
                            className="cursor-pointer"
                          >
                            <Card className="card-glass hover:border-primary/30 transition-all">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">{report.playerName}</h3>
                                        <Badge variant="outline" className="text-xs">{report.position}</Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {report.date} • vs {report.opposition} • {report.competition}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge className={getRecommendationColor(report.recommendation)}>
                                      {report.recommendation}
                                    </Badge>
                                    <div className="rating-badge-sm">{report.rating}</div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'compare' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold">Player Comparison</h2>
                        <p className="text-muted-foreground">Compare players side by side</p>
                      </div>
                      <div className="grid lg:grid-cols-2 gap-6">
                        <Card className="card-glass">
                          <CardHeader>
                            <CardTitle>Attribute Comparison</CardTitle>
                            <CardDescription>Marcus Johnson vs André Silva</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <AttributeRadarChart
                              data={radarData}
                              color="hsl(158, 64%, 45%)"
                              compareData={compareData}
                              compareColor="hsl(38, 92%, 50%)"
                              labels={{ primary: 'Marcus Johnson', compare: 'André Silva' }}
                            />
                          </CardContent>
                        </Card>
                        <div className="space-y-4">
                          <Card className="card-glass" style={{ borderTop: '3px solid hsl(158, 64%, 45%)' }}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Marcus Johnson</CardTitle>
                                <div className="rating-badge-sm">82</div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Pace</span><span className="font-medium">19</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Dribbling</span><span className="font-medium">18</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Shooting</span><span className="font-medium">17</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Passing</span><span className="font-medium">16</span></div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="card-glass" style={{ borderTop: '3px solid hsl(38, 92%, 50%)' }}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">André Silva</CardTitle>
                                <div className="rating-badge-sm">78</div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Positioning</span><span className="font-medium">18</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Stamina</span><span className="font-medium">18</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Awareness</span><span className="font-medium">17</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Passing</span><span className="font-medium">17</span></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'discovery' && <DemoAIDiscovery />}
                  
                  {activeTab === 'analytics' && <DemoAnalytics />}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Player Detail Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">{selectedPlayer.name}</DialogTitle>
                      <p className="text-muted-foreground">{selectedPlayer.positionFull} • {selectedPlayer.club}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-2xl font-bold text-primary">{selectedPlayer.rating}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Potential</p>
                      <p className="text-2xl font-bold text-gradient-gold">{selectedPlayer.potential}</p>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Age</p><p className="font-medium">{selectedPlayer.age} years</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Nationality</p><p className="font-medium">{selectedPlayer.nationality}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Height</p><p className="font-medium">{selectedPlayer.height} cm</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Foot</p><p className="font-medium">{selectedPlayer.preferredFoot}</p></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 py-4">
                {(['technical', 'tactical', 'physical', 'mental'] as const).map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-semibold text-primary flex items-center gap-2 capitalize">
                      {category === 'technical' && <Target className="w-4 h-4" />}
                      {category === 'tactical' && <BarChart3 className="w-4 h-4" />}
                      {category === 'physical' && <Zap className="w-4 h-4" />}
                      {category === 'mental' && <Shield className="w-4 h-4" />}
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(selectedPlayer.attributes[category]).map(([name, value]) => (
                        <AttributeBar key={name} name={name.replace(/([A-Z])/g, ' $1').trim()} value={value} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Strengths</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.strengths}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Weaknesses</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.weaknesses}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedPlayer(null)}>Close</Button>
                <Button variant="hero" asChild><Link to="/auth">Start Scouting</Link></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl mb-1">{selectedReport.playerName}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{selectedReport.position}</Badge>
                      <span>{selectedReport.date}</span>
                      <span>•</span>
                      <span>vs {selectedReport.opposition}</span>
                    </div>
                  </div>
                  <Badge className={getRecommendationColor(selectedReport.recommendation)}>{selectedReport.recommendation}</Badge>
                </div>
              </DialogHeader>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{selectedReport.rating}</p>
                  <p className="text-xs text-muted-foreground">Overall Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gradient-gold">{selectedReport.potential}</p>
                  <p className="text-xs text-muted-foreground">Potential</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedReport.minutesObserved}'</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2"><ThumbsUp className="w-4 h-4" />Strengths</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.strengths}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <h4 className="font-semibold text-amber-500 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Areas to Improve</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.weaknesses}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />Scout's Notes</h4>
                <p className="text-sm text-muted-foreground">{selectedReport.matchNotes}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                <Button variant="hero" asChild><Link to="/auth">Create Your Own Reports</Link></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join professional scouts using The Football Scout to discover and track talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Free Account
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">© 2026 The Football Scout. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
