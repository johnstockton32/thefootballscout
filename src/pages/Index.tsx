import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, FileText, Shield, Zap, Target } from 'lucide-react';
export default function Index() {
  const navigate = useNavigate();
  const {
    user,
    isLoading
  } = useAuth();
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);
  const features = [{
    icon: Users,
    title: 'Player Profiles',
    description: 'Create detailed profiles with positions, physical attributes, and career history.'
  }, {
    icon: FileText,
    title: 'Match Reports',
    description: 'Submit structured scouting reports with 20+ attribute ratings per match.'
  }, {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Radar charts, trend analysis, and position-weighted scoring (0-100).'
  }, {
    icon: Target,
    title: 'Player Comparison',
    description: 'Compare 2-5 players side-by-side with benchmark overlays.'
  }, {
    icon: Zap,
    title: 'Autosave Forms',
    description: 'Never lose your work with intelligent form autosaving.'
  }, {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'Secure data handling with full GDPR compliance built-in.'
  }];
  return <div className="min-h-screen bg-background pitch-pattern">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Professional Scouting Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Scout Smarter.</span>
            <br />
            <span className="text-gradient-pitch">Discover Talent.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">The complete scouting toolkit for identifying, evaluating, and tracking football talent. From grassroots to professional levels</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
              Start Scouting Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg" onClick={() => navigate('/auth')}>
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gradient-pitch">20+</p>
              <p className="text-sm text-muted-foreground mt-1">Attributes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gradient-gold">0-100</p>
              <p className="text-sm text-muted-foreground mt-1">Rating Scale</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">8</p>
              <p className="text-sm text-muted-foreground mt-1">Positions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Professional-grade tools designed for scouts at every level</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <div key={feature.title} className="card-glass p-6 rounded-xl hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find the next star?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join scouts worldwide using The Football Scout to discover and track talent.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText={false} />
          <p className="text-sm text-muted-foreground">
            © 2026 The Football Scout. GDPR Compliant.
          </p>
        </div>
      </footer>
    </div>;
}