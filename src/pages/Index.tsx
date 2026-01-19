import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, FileText, Shield, Zap, Target, Download } from 'lucide-react';
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
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/install')}>
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/pricing')}>
              Pricing
            </Button>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={() => navigate('/auth')}>
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-rating-gold/5 animate-[gradient-shift_8s_ease-in-out_infinite]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rating-gold/8 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite_reverse]" />
        </div>
        <div className="container mx-auto text-center max-w-4xl relative">
          {/* Logo Display - Hero Spotlight */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl scale-150 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-rating-gold/20 to-primary/20 rounded-full blur-2xl scale-125" />
              {/* Logo with enhanced styling */}
              <div className="relative p-4 sm:p-6 rounded-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-primary/20 shadow-2xl shadow-primary/20">
                <Logo size="xl" className="drop-shadow-2xl [&_img]:w-28 [&_img]:h-28 sm:[&_img]:w-36 sm:[&_img]:h-36 md:[&_img]:w-44 md:[&_img]:h-44" />
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-primary font-medium">Professional Scouting Platform</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-foreground">Scout Smarter.</span>
            <br />
            <span className="text-gradient-pitch">Discover Talent.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-2">The complete scouting toolkit for identifying, evaluating, and tracking football talent. From grassroots to professional levels</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
              Start Scouting Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/demo')}>
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-pitch">20+</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Attributes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-gold">0-100</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Rating Scale</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">8</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Positions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Everything You Need</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2">Professional-grade tools designed for scouts at every level</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="card-glass p-4 sm:p-6 rounded-xl hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to find the next star?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
            Join scouts worldwide using The Football Scout to discover and track talent.
          </p>
          <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © 2026 The Football Scout. GDPR Compliant.
          </p>
        </div>
      </footer>
    </div>;
}