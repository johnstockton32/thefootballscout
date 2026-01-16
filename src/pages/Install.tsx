import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Smartphone,
  Wifi,
  WifiOff,
  Zap,
  Check,
  Share,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: WifiOff,
      title: 'Works Offline',
      description: 'Access player data and reports even without internet',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant loading with cached data and assets',
    },
    {
      icon: Smartphone,
      title: 'Native Feel',
      description: 'Full-screen experience like a native app',
    },
    {
      icon: Download,
      title: 'No App Store',
      description: 'Install directly from your browser',
    },
  ];

  return (
    <div className="min-h-screen bg-background pitch-pattern">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="cursor-pointer">
            <Logo size="sm" showText={false} className="sm:hidden" />
            <Logo size="sm" className="hidden sm:flex" />
          </button>
          <Badge
            variant={isOnline ? 'default' : 'secondary'}
            className="flex items-center gap-1.5"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Install The Football Scout
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Add to your home screen for instant access, offline support, and a native app experience.
          </p>

          {isInstalled ? (
            <div className="space-y-4">
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Check className="w-4 h-4 mr-2" />
                Already Installed
              </Badge>
              <p className="text-sm text-muted-foreground">
                You can find The Football Scout on your home screen.
              </p>
              <Button variant="hero" onClick={() => navigate('/dashboard')}>
                Open App
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : isIOS ? (
            <Card className="card-glass text-left">
              <CardHeader>
                <CardTitle className="text-lg">Install on iOS</CardTitle>
                <CardDescription>
                  Follow these steps to add to your home screen:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Look for <Share className="w-4 h-4" /> in Safari's toolbar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Add to Home Screen</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Scroll and tap <Plus className="w-4 h-4" /> "Add to Home Screen"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap Add</p>
                    <p className="text-sm text-muted-foreground">
                      Confirm to add the app to your home screen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Button variant="hero" size="xl" onClick={handleInstall}>
              <Download className="w-5 h-5" />
              Install App
            </Button>
          ) : (
            <Card className="card-glass text-left">
              <CardHeader>
                <CardTitle className="text-lg">Install from Browser</CardTitle>
                <CardDescription>
                  Use your browser's menu to install:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  • <strong>Chrome:</strong> Menu (⋮) → "Install app" or "Add to Home screen"
                </p>
                <p className="text-sm text-muted-foreground">
                  • <strong>Edge:</strong> Menu (⋯) → "Apps" → "Install this site as an app"
                </p>
                <p className="text-sm text-muted-foreground">
                  • <strong>Firefox:</strong> Menu (≡) → "Install"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Why Install?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="card-glass">
                <CardContent className="flex items-start gap-4 py-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to scout on the go?</h2>
          <p className="text-muted-foreground mb-6">
            Access your scouting data anytime, anywhere—even without internet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" onClick={() => navigate('/auth')}>
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/demo')}>
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText={false} />
          <p className="text-sm text-muted-foreground">
            © 2026 The Football Scout. Works offline.
          </p>
        </div>
      </footer>
    </div>
  );
}