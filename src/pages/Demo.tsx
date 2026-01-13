import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  MapPin,
  Ruler,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

// Demo data for showcase
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
  },
];

const demoReports = [
  {
    id: '1',
    playerName: 'Marcus Johnson',
    date: 'Jan 10, 2026',
    opposition: 'Liverpool U21',
    competition: 'PL2',
    rating: 85,
  },
  {
    id: '2',
    playerName: 'André Silva',
    date: 'Jan 8, 2026',
    opposition: 'Benfica B',
    competition: 'Liga Portugal 2',
    rating: 79,
  },
  {
    id: '3',
    playerName: 'Kenji Tanaka',
    date: 'Jan 5, 2026',
    opposition: 'Kawasaki Frontale',
    competition: 'J.League Cup',
    rating: 77,
  },
];

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

export default function Demo() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
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
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Professional Scouting
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
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
              <div className="grid md:grid-cols-3 gap-6">
                {demoPlayers.map((player) => (
                  <Card key={player.id} className="card-glass hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Users className="w-7 h-7 text-primary" />
                        </div>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle>Recent Scouting Reports</CardTitle>
                  <CardDescription>Latest match observations and evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoReports.map((report) => (
                      <div 
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-medium">{report.playerName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {report.date} • vs {report.opposition} • {report.competition}
                          </p>
                        </div>
                        <div className="rating-badge-sm">{report.rating}</div>
                      </div>
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
