import { ArrowLeft, Sparkles, Shield, Zap, Bug, Star, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  version: string;
  date: string;
  tag: "major" | "minor" | "patch";
  highlights: { icon: React.ReactNode; text: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "February 2026",
    tag: "major",
    highlights: [
      { icon: <Rocket className="h-4 w-4" />, text: "Official public launch of The Football Scout" },
      { icon: <Sparkles className="h-4 w-4" />, text: "AI-powered scouting insights and smart player discovery" },
      { icon: <Shield className="h-4 w-4" />, text: "Full offline mode with automatic cloud sync" },
      { icon: <Zap className="h-4 w-4" />, text: "Pro tier with unlimited reports, PDF exports, and bulk CSV import/export" },
      { icon: <Star className="h-4 w-4" />, text: "Interactive onboarding tour and sample data for new users" },
      { icon: <Shield className="h-4 w-4" />, text: "GDPR-compliant data handling and account deletion" },
    ],
  },
  {
    version: "0.9.0",
    date: "January 2026",
    tag: "minor",
    highlights: [
      { icon: <Zap className="h-4 w-4" />, text: "Stripe payment integration with subscription management" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Watchlists for organising players into custom groups" },
      { icon: <Bug className="h-4 w-4" />, text: "Cross-device email confirmation edge case resolved" },
      { icon: <Shield className="h-4 w-4" />, text: "Private avatar storage with signed URLs" },
    ],
  },
  {
    version: "0.8.0",
    date: "December 2025",
    tag: "minor",
    highlights: [
      { icon: <Star className="h-4 w-4" />, text: "Player comparison tool with radar charts" },
      { icon: <Zap className="h-4 w-4" />, text: "Voice-to-text input for scouting reports" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Custom attribute weight presets per position" },
      { icon: <Bug className="h-4 w-4" />, text: "Improved skeleton loading states across all pages" },
    ],
  },
];

const tagColors: Record<string, string> = {
  major: "bg-primary/20 text-primary border-primary/30",
  minor: "bg-accent/20 text-accent-foreground border-accent/30",
  patch: "bg-muted text-muted-foreground border-border",
};

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background pitch-pattern">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">What's New</h1>
            <p className="text-muted-foreground">Latest updates and improvements</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border hidden sm:block" />

            <div className="space-y-8">
              {changelog.map((entry) => (
                <div key={entry.version} className="relative flex gap-4 sm:gap-6">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 items-center justify-center border-2 border-background z-10">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>

                  <Card className="card-glass flex-1">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h2 className="text-lg font-bold">v{entry.version}</h2>
                        <Badge variant="outline" className={tagColors[entry.tag]}>
                          {entry.tag}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-auto">{entry.date}</span>
                      </div>
                      <ul className="space-y-3">
                        {entry.highlights.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5 flex-shrink-0">{item.icon}</span>
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Changelog;
