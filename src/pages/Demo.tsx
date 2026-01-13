import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Logo } from '@/components/Logo';
import { AttributeRadarChart } from '@/components/charts/AttributeRadarChart';

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const modalContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.05,
    },
  },
};

const modalItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

const reportRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  hover: {
    x: 4,
    transition: {
      duration: 0.15,
    },
  },
};
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
  X,
  Clock,
  Trophy,
  Eye,
  ThumbsUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// Extended demo data with full attributes
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
    photo: null,
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
    photo: null,
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
    photo: null,
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

// Extended demo reports with full match data
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
    strengths: 'Outstanding performance. Two goals and an assist. Electric pace caused problems all game. Clinical finishing when chances fell.',
    weaknesses: 'Still needs to work on hold-up play and aerial duels. Lost possession when pressed high.',
    matchNotes: 'Dominant display against a strong Liverpool U21 side. Showed maturity beyond his years in key moments. Ready for first-team consideration.',
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
    strengths: 'Controlled the tempo of the game exceptionally. Passing range was outstanding, completed 92% of passes. Covered every blade of grass.',
    weaknesses: 'Missed a clear shooting opportunity. Could be more aggressive in the final third.',
    matchNotes: 'Solid all-round performance in a tight derby match. Shows leadership qualities despite young age. Would benefit from a loan to top-flight football.',
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
    strengths: 'Won all aerial duels (7/7). Strong in the tackle and read the game superbly. Organized the backline effectively.',
    weaknesses: 'Struggled with pace when isolated 1v1. Distribution under pressure needs work.',
    matchNotes: 'Impressive debut against senior opposition. Despite the step up in quality, handled himself with composure. One to watch for European scouts.',
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
  {
    icon: Users,
    title: 'Player Database',
    description: 'Manage comprehensive player profiles with photos, stats, and personal details.',
  },
  {
    icon: FileText,
    title: 'Scouting Reports',
    description: 'Create detailed match reports with 20+ attribute ratings across 4 categories.',
  },
  {
    icon: BarChart3,
    title: 'Player Comparison',
    description: 'Compare 2-5 players side-by-side with visual radar charts.',
  },
  {
    icon: Target,
    title: 'Attribute Tracking',
    description: 'Track technical, tactical, physical, and mental attributes over time.',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'Built with data protection and consent management from the ground up.',
  },
  {
    icon: Zap,
    title: 'Export & Reports',
    description: 'Export data to CSV and generate professional PDF scouting reports.',
  },
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
        <div 
          className={`h-full rounded-full transition-all ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-6 text-right">{value}</span>
    </div>
  );
}

export default function Demo() {
  const [activeTab, setActiveTab] = useState('players');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
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
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Demo Mode
            </Badge>
            <Button variant="outline" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Professional Scouting Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            The Complete{' '}
            <span className="text-gradient-gold">Football Scouting</span>{' '}
            Solution
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage player profiles, create detailed scouting reports, and compare talent 
            with our professional-grade platform built for serious scouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Everything You Need for Professional Scouting
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Card className="card-glass h-full">
                  <CardContent className="pt-6">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Explore our demo data to see how The Football Scout helps you manage 
            your scouting workflow.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="players" className="gap-2">
                <Users className="w-4 h-4" />
                Players
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Compare
              </TabsTrigger>
            </TabsList>

            {/* Players Tab */}
            <TabsContent value="players" className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Click on a player card to view detailed stats and attributes
              </p>
              <div className="grid md:grid-cols-3 gap-6">
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
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <motion.div 
                            className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Users className="w-7 h-7 text-primary" />
                          </motion.div>
                          <Badge className="position-badge">{player.position}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{player.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {player.positionFull} • {player.club}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {player.age} yrs
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {player.nationality}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <p className="text-xl font-bold text-primary">{player.rating}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Potential</p>
                            <p className="text-xl font-bold text-gradient-gold">{player.potential}</p>
                          </div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          >
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click on a report to view detailed match observations and ratings
              </p>
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle>Recent Scouting Reports</CardTitle>
                  <CardDescription>Latest match observations and evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoReports.map((report, index) => (
                      <motion.div 
                        key={report.id}
                        custom={index}
                        variants={reportRowVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-transparent hover:border-primary/50 cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-medium">{report.playerName}</span>
                            <Badge variant="outline" className="text-xs">{report.position}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {report.date} • vs {report.opposition} • {report.competition}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRecommendationColor(report.recommendation)}>
                            {report.recommendation}
                          </Badge>
                          <div className="rating-badge-sm">{report.rating}</div>
                          <motion.div
                            initial={{ opacity: 0, x: -5 }}
                            whileHover={{ opacity: 1, x: 0 }}
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Attribute Comparison</CardTitle>
                    <CardDescription>
                      Marcus Johnson vs André Silva
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AttributeRadarChart
                      data={radarData}
                      color="hsl(158, 64%, 45%)"
                      compareData={compareData}
                      compareColor="hsl(38, 92%, 50%)"
                      labels={{
                        primary: 'Marcus Johnson',
                        compare: 'André Silva',
                      }}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {/* Player 1 Stats */}
                  <Card className="card-glass" style={{ borderTop: '3px solid hsl(158, 64%, 45%)' }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Marcus Johnson</CardTitle>
                        <div className="rating-badge-sm">82</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pace</span>
                          <span className="font-medium">19</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dribbling</span>
                          <span className="font-medium">18</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shooting</span>
                          <span className="font-medium">17</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Passing</span>
                          <span className="font-medium">16</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Player 2 Stats */}
                  <Card className="card-glass" style={{ borderTop: '3px solid hsl(38, 92%, 50%)' }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">André Silva</CardTitle>
                        <div className="rating-badge-sm">78</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Positioning</span>
                          <span className="font-medium">18</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stamina</span>
                          <span className="font-medium">18</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Awareness</span>
                          <span className="font-medium">17</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Passing</span>
                          <span className="font-medium">17</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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

              {/* Player Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedPlayer.age} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nationality</p>
                    <p className="font-medium">{selectedPlayer.nationality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="font-medium">{selectedPlayer.height} cm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Foot</p>
                    <p className="font-medium">{selectedPlayer.preferredFoot}</p>
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid md:grid-cols-2 gap-6 py-4">
                {/* Technical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Technical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Passing" value={selectedPlayer.attributes.technical.passing} />
                    <AttributeBar name="Dribbling" value={selectedPlayer.attributes.technical.dribbling} />
                    <AttributeBar name="Shooting" value={selectedPlayer.attributes.technical.shooting} />
                    <AttributeBar name="First Touch" value={selectedPlayer.attributes.technical.firstTouch} />
                    <AttributeBar name="Crossing" value={selectedPlayer.attributes.technical.crossing} />
                    <AttributeBar name="Heading" value={selectedPlayer.attributes.technical.heading} />
                  </div>
                </div>

                {/* Tactical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Tactical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Positioning" value={selectedPlayer.attributes.tactical.positioning} />
                    <AttributeBar name="Awareness" value={selectedPlayer.attributes.tactical.awareness} />
                    <AttributeBar name="Decision Making" value={selectedPlayer.attributes.tactical.decisionMaking} />
                    <AttributeBar name="Off-Ball Movement" value={selectedPlayer.attributes.tactical.offBallMovement} />
                    <AttributeBar name="Def. Contribution" value={selectedPlayer.attributes.tactical.defensiveContribution} />
                  </div>
                </div>

                {/* Physical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Physical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Pace" value={selectedPlayer.attributes.physical.pace} />
                    <AttributeBar name="Stamina" value={selectedPlayer.attributes.physical.stamina} />
                    <AttributeBar name="Strength" value={selectedPlayer.attributes.physical.strength} />
                    <AttributeBar name="Agility" value={selectedPlayer.attributes.physical.agility} />
                    <AttributeBar name="Balance" value={selectedPlayer.attributes.physical.balance} />
                  </div>
                </div>

                {/* Mental */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Mental
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Composure" value={selectedPlayer.attributes.mental.composure} />
                    <AttributeBar name="Concentration" value={selectedPlayer.attributes.mental.concentration} />
                    <AttributeBar name="Aggression" value={selectedPlayer.attributes.mental.aggression} />
                    <AttributeBar name="Work Rate" value={selectedPlayer.attributes.mental.workRate} />
                    <AttributeBar name="Leadership" value={selectedPlayer.attributes.mental.leadership} />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Strengths
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.strengths}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Areas to Improve
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.weaknesses}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedPlayer(null)}>
                  Close
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth">Sign Up to Scout</Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">{selectedReport.playerName}</DialogTitle>
                      <p className="text-muted-foreground">{selectedReport.club} • {selectedReport.position}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Badge className={getRecommendationColor(selectedReport.recommendation)}>
                      {selectedReport.recommendation}
                    </Badge>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-2xl font-bold text-primary">{selectedReport.rating}</p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Match Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Match Date</p>
                    <p className="font-medium">{selectedReport.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Competition</p>
                    <p className="font-medium">{selectedReport.competition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Opposition</p>
                    <p className="font-medium">{selectedReport.opposition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Minutes Observed</p>
                    <p className="font-medium">{selectedReport.minutesObserved}'</p>
                  </div>
                </div>
              </div>

              {/* Competition Level & Potential */}
              <div className="flex items-center gap-4 py-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {selectedReport.competitionLevel}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Potential:</span>
                  <span className="font-bold text-gradient-gold">{selectedReport.potential}</span>
                </div>
              </div>

              {/* Radar Chart with Category Scores */}
              <div className="py-4 border-b border-border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Attribute Overview
                </h4>
                
                {(() => {
                  const tech = selectedReport.attributes.technical;
                  const tact = selectedReport.attributes.tactical;
                  const phys = selectedReport.attributes.physical;
                  const ment = selectedReport.attributes.mental;
                  
                  const techAvg = (tech.passing + tech.dribbling + tech.shooting + tech.firstTouch + tech.crossing + tech.heading) / 6;
                  const tactAvg = (tact.positioning + tact.awareness + tact.decisionMaking + tact.offBallMovement + tact.defensiveContribution) / 5;
                  const physAvg = (phys.pace + phys.stamina + phys.strength + phys.agility + phys.balance) / 5;
                  const mentAvg = (ment.composure + ment.concentration + ment.aggression + ment.workRate + ment.leadership) / 5;
                  
                  // Calculate overall score normalized to 0-100
                  const overallScore = Math.round(((techAvg + tactAvg + physAvg + mentAvg) / 4) * 5);
                  
                  const getScoreColor = (score: number) => {
                    if (score >= 85) return 'text-primary';
                    if (score >= 70) return 'text-amber-500';
                    if (score >= 55) return 'text-blue-500';
                    return 'text-muted-foreground';
                  };
                  
                  const getScoreLabel = (score: number) => {
                    if (score >= 90) return 'World Class';
                    if (score >= 80) return 'Excellent';
                    if (score >= 70) return 'Very Good';
                    if (score >= 60) return 'Good';
                    if (score >= 50) return 'Average';
                    return 'Developing';
                  };
                  
                  const categories = [
                    { name: 'Technical', avg: Math.round(techAvg), icon: Target, color: 'bg-primary', textColor: 'text-primary' },
                    { name: 'Tactical', avg: Math.round(tactAvg), icon: BarChart3, color: 'bg-blue-500', textColor: 'text-blue-500' },
                    { name: 'Physical', avg: Math.round(physAvg), icon: Zap, color: 'bg-amber-500', textColor: 'text-amber-500' },
                    { name: 'Mental', avg: Math.round(mentAvg), icon: Shield, color: 'bg-purple-500', textColor: 'text-purple-500' },
                  ];
                  
                  return (
                    <>
                      {/* Overall Score */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, type: 'spring' }}
                        className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Overall Match Rating</p>
                            <div className="flex items-baseline gap-2">
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className={`text-5xl font-bold ${getScoreColor(overallScore)}`}
                              >
                                {overallScore}
                              </motion.span>
                              <span className="text-xl text-muted-foreground">/100</span>
                            </div>
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                              className={`text-sm font-medium mt-1 ${getScoreColor(overallScore)}`}
                            >
                              {getScoreLabel(overallScore)}
                            </motion.p>
                          </div>
                          
                          {/* Circular Progress */}
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="8"
                              />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="hsl(158, 64%, 45%)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={251.2}
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * overallScore) / 100 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Star className="w-8 h-8 text-primary" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Category breakdown bar */}
                        <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
                          {categories.map((cat, i) => (
                            <motion.div
                              key={cat.name}
                              initial={{ width: 0 }}
                              animate={{ width: '25%' }}
                              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                              className={`${cat.color} relative group`}
                              style={{ opacity: 0.3 + (cat.avg / 20) * 0.7 }}
                              title={`${cat.name}: ${cat.avg}/20`}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Technical</span>
                          <span>Tactical</span>
                          <span>Physical</span>
                          <span>Mental</span>
                        </div>
                      </motion.div>
                      
                      <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div className="max-w-sm mx-auto w-full">
                          <AttributeRadarChart
                            data={[
                              { attribute: 'Passing', value: selectedReport.attributes.technical.passing, fullMark: 20 },
                              { attribute: 'Dribbling', value: selectedReport.attributes.technical.dribbling, fullMark: 20 },
                              { attribute: 'Shooting', value: selectedReport.attributes.technical.shooting, fullMark: 20 },
                              { attribute: 'Positioning', value: selectedReport.attributes.tactical.positioning, fullMark: 20 },
                              { attribute: 'Awareness', value: selectedReport.attributes.tactical.awareness, fullMark: 20 },
                              { attribute: 'Pace', value: selectedReport.attributes.physical.pace, fullMark: 20 },
                              { attribute: 'Stamina', value: selectedReport.attributes.physical.stamina, fullMark: 20 },
                              { attribute: 'Composure', value: selectedReport.attributes.mental.composure, fullMark: 20 },
                            ]}
                            color="hsl(158, 64%, 45%)"
                          />
                        </div>
                        
                        {/* Category Averages */}
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((cat, index) => (
                            <motion.div
                              key={cat.name}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg ${cat.color}/20 flex items-center justify-center`}>
                                  <cat.icon className={`w-4 h-4 ${cat.textColor}`} />
                                </div>
                                <span className="text-sm font-medium">{cat.name}</span>
                              </div>
                              <div className="flex items-end gap-1">
                                <span className="text-3xl font-bold">{cat.avg}</span>
                                <span className="text-sm text-muted-foreground mb-1">/20</span>
                              </div>
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(cat.avg / 20) * 100}%` }}
                                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                  className={`h-full rounded-full ${cat.color}`}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Attributes Grid */}
              <div className="grid md:grid-cols-2 gap-6 py-4">
                {/* Technical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Technical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Passing" value={selectedReport.attributes.technical.passing} />
                    <AttributeBar name="Dribbling" value={selectedReport.attributes.technical.dribbling} />
                    <AttributeBar name="Shooting" value={selectedReport.attributes.technical.shooting} />
                    <AttributeBar name="First Touch" value={selectedReport.attributes.technical.firstTouch} />
                    <AttributeBar name="Crossing" value={selectedReport.attributes.technical.crossing} />
                    <AttributeBar name="Heading" value={selectedReport.attributes.technical.heading} />
                  </div>
                </div>

                {/* Tactical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Tactical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Positioning" value={selectedReport.attributes.tactical.positioning} />
                    <AttributeBar name="Awareness" value={selectedReport.attributes.tactical.awareness} />
                    <AttributeBar name="Decision Making" value={selectedReport.attributes.tactical.decisionMaking} />
                    <AttributeBar name="Off-Ball Movement" value={selectedReport.attributes.tactical.offBallMovement} />
                    <AttributeBar name="Def. Contribution" value={selectedReport.attributes.tactical.defensiveContribution} />
                  </div>
                </div>

                {/* Physical */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Physical
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Pace" value={selectedReport.attributes.physical.pace} />
                    <AttributeBar name="Stamina" value={selectedReport.attributes.physical.stamina} />
                    <AttributeBar name="Strength" value={selectedReport.attributes.physical.strength} />
                    <AttributeBar name="Agility" value={selectedReport.attributes.physical.agility} />
                    <AttributeBar name="Balance" value={selectedReport.attributes.physical.balance} />
                  </div>
                </div>

                {/* Mental */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Mental
                  </h4>
                  <div className="space-y-2">
                    <AttributeBar name="Composure" value={selectedReport.attributes.mental.composure} />
                    <AttributeBar name="Concentration" value={selectedReport.attributes.mental.concentration} />
                    <AttributeBar name="Aggression" value={selectedReport.attributes.mental.aggression} />
                    <AttributeBar name="Work Rate" value={selectedReport.attributes.mental.workRate} />
                    <AttributeBar name="Leadership" value={selectedReport.attributes.mental.leadership} />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Strengths
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.strengths}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <h4 className="font-semibold text-amber-500 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Areas to Improve
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.weaknesses}</p>
                </div>
              </div>

              {/* Match Notes */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border mt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Scout's Notes
                </h4>
                <p className="text-sm text-muted-foreground">{selectedReport.matchNotes}</p>
              </div>

              {/* CTA */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth">Create Your Own Reports</Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2026 The Football Scout. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/gdpr-consent" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
