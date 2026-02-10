import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share, Plus, MoreVertical, ArrowLeft, Check, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background pitch-pattern">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="cursor-pointer">
            <Logo size="sm" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Install <span className="text-gradient-pitch">The Football Scout</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Add the app to your home screen for instant access, offline support, and a native app experience.
          </p>

          {isInstalled ? (
            <Card className="card-glass border-primary/30 max-w-md mx-auto">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Already Installed!</h3>
                <p className="text-sm text-muted-foreground">
                  The Football Scout is installed on this device. Open it from your home screen.
                </p>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Button variant="hero" size="lg" onClick={handleInstall} className="mx-auto">
              <Download className="w-5 h-5" />
              Install Now
            </Button>
          ) : (
            <div className="space-y-8 max-w-md mx-auto text-left">
              {isIOS ? (
                <Card className="card-glass border-border/50">
                  <CardContent className="pt-6 space-y-5">
                    <h3 className="font-bold text-lg text-center">Install on iPhone / iPad</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">1</div>
                        <div>
                          <p className="font-medium">Tap the Share button</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for the <Share className="w-4 h-4 inline" /> icon in Safari's toolbar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">2</div>
                        <div>
                          <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for the <Plus className="w-4 h-4 inline" /> icon in the menu
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">3</div>
                        <div>
                          <p className="font-medium">Tap "Add" to confirm</p>
                          <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-glass border-border/50">
                  <CardContent className="pt-6 space-y-5">
                    <h3 className="font-bold text-lg text-center">Install on Android</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">1</div>
                        <div>
                          <p className="font-medium">Tap the browser menu</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for the <MoreVertical className="w-4 h-4 inline" /> icon in Chrome
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">2</div>
                        <div>
                          <p className="font-medium">Tap "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground">Or "Install App" if prompted</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">3</div>
                        <div>
                          <p className="font-medium">Confirm the installation</p>
                          <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="mt-12">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
