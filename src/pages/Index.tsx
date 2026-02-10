import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, FileText, Shield, Zap, Target, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const features = [
    { icon: Users, title: 'Player Profiles', description: 'Create detailed profiles with positions, physical attributes, and career history.' },
    { icon: FileText, title: 'Match Reports', description: 'Submit structured scouting reports with 20+ attribute ratings per match.' },
    { icon: BarChart3, title: 'Visual Analytics', description: 'Radar charts, trend analysis, and position-weighted scoring (0-100).' },
    { icon: Target, title: 'Player Comparison', description: 'Compare 2-5 players side-by-side with benchmark overlays.' },
    { icon: Zap, title: 'Autosave Forms', description: 'Never lose your work with intelligent form autosaving.' },
    { icon: Shield, title: 'GDPR Compliant', description: 'Secure data handling with full GDPR compliance built-in.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/40 safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/pricing')}>
              Pricing
            </Button>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" className="text-xs sm:text-sm px-3 sm:px-5" onClick={() => navigate('/auth')}>
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-28 px-4">
        {/* Dynamic gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-[hsl(var(--energy)_/_0.06)]" />
          <div className="absolute top-10 left-[15%] w-[500px] h-[500px] bg-primary/12 rounded-full blur-[120px] animate-[float_7s_ease-in-out_infinite]" />
          <div className="absolute bottom-10 right-[10%] w-[400px] h-[400px] bg-[hsl(var(--energy)_/_0.08)] rounded-full blur-[100px] animate-[float_9s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] animate-[float_11s_ease-in-out_infinite]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 pitch-pattern opacity-40" />
        </div>

        <motion.div 
          className="container mx-auto text-center max-w-5xl relative"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Logo Display */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8 sm:mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/25 rounded-full blur-3xl scale-[1.8] animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-[hsl(var(--energy)_/_0.15)] to-primary/15 rounded-full blur-2xl scale-[1.4]" />
              <div className="relative p-5 sm:p-7 rounded-full bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-lg border border-primary/25 shadow-2xl shadow-primary/20">
                <Logo size="xl" className="drop-shadow-2xl [&_img]:w-32 [&_img]:h-32 sm:[&_img]:w-44 sm:[&_img]:h-44 md:[&_img]:w-52 md:[&_img]:h-52" />
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/25 mb-7 sm:mb-9 group cursor-default">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-primary font-semibold tracking-wide">Professional Scouting Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-5 sm:mb-7 leading-[1.05] font-heading">
            <span className="text-foreground">Scout Smarter.</span>
            <br />
            <span className="text-gradient-pitch">Discover Talent.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-muted-foreground mb-9 sm:mb-12 max-w-2xl mx-auto px-2 leading-relaxed">
            The complete scouting toolkit for identifying, evaluating, and tracking football talent. From grassroots to professional levels.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
              Start Scouting Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/demo')}>
              View Demo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 sm:gap-10 mt-16 sm:mt-20 max-w-lg mx-auto">
            {[
              { value: '20+', label: 'Attributes', gradient: 'text-gradient-pitch' },
              { value: '0-100', label: 'Rating Scale', gradient: 'text-gradient-gold' },
              { value: '8', label: 'Positions', gradient: 'text-foreground' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${stat.gradient} font-heading transition-transform duration-300 group-hover:scale-110`}>
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 relative">
        <div className="absolute inset-0 bg-card/40" />
        <div className="container mx-auto max-w-6xl relative">
          <motion.div 
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 font-heading">Everything You Need</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2">Professional-grade tools designed for scouts at every level</p>
          </motion.div>
          
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature) => (
              <motion.div 
                key={feature.title} 
                variants={itemVariants}
                className="card-glass p-5 sm:p-7 rounded-2xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
              >
                {/* Hover gradient accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-transparent transition-all duration-500" />
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/15 transition-colors duration-300 group-hover:scale-110 transform">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 font-heading">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[100px]" />
        </div>
        <motion.div 
          className="container mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-7 font-heading">
            Ready to find the <span className="text-gradient-pitch">next star</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 px-2 max-w-xl mx-auto">
            Join scouts worldwide using The Football Scout to discover and track talent.
          </p>
          <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 sm:py-10 px-4 bg-card/20">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-5">
            <a href="/privacy-policy" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="mailto:support@thefootballscout.app" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </a>
            <p className="text-xs sm:text-sm text-muted-foreground text-center w-full sm:w-auto">
              © 2026 The Football Scout. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}