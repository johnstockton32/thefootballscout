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
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header - frosted glass */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground" onClick={() => navigate('/pricing')}>
              Pricing
            </Button>
            <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button size="sm" className="text-sm px-4" onClick={() => navigate('/auth')}>
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - clean and airy */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4">
        <motion.div 
          className="container mx-auto text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="p-5 sm:p-6 rounded-3xl bg-secondary/50 border border-border">
              <Logo size="xl" className="[&_img]:w-28 [&_img]:h-28 sm:[&_img]:w-36 sm:[&_img]:h-36" />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs sm:text-sm text-primary font-medium">Professional Scouting Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-5 leading-[1.08] tracking-tight">
            <span className="text-foreground">Scout Smarter.</span>
            <br />
            <span className="text-primary">Discover Talent.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The complete scouting toolkit for identifying, evaluating, and tracking football talent. From grassroots to professional levels.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="xl" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
              Start Scouting Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/demo')}>
              View Demo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 sm:gap-12 mt-20 max-w-md mx-auto">
            {[
              { value: '20+', label: 'Attributes' },
              { value: '0-100', label: 'Rating Scale' },
              { value: '8', label: 'Positions' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 px-4 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Professional-grade tools designed for scouts at every level</p>
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
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors duration-200 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 px-4 border-t border-border">
        <motion.div 
          className="container mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">
            Ready to find the <span className="text-primary">next star</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join scouts worldwide using The Football Scout to discover and track talent.
          </p>
          <Button size="xl" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="mailto:support@thefootballscout.app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </a>
            <p className="text-sm text-muted-foreground w-full sm:w-auto text-center">
              © 2026 The Football Scout
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
