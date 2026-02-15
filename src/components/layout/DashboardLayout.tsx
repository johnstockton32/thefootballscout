import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MobileBottomNav } from './MobileBottomNav';
import { useSubscription } from '@/hooks/useSubscription';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationToggle } from '@/components/NotificationToggle';
import { BulkExportModal } from '@/components/BulkExportModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Shield,
  Crown,
  Sparkles,
  List,
  MessageSquare,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const baseNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', minTier: 'free' as const },
  { icon: Users, label: 'Players', href: '/players', minTier: 'free' as const },
  { icon: FileText, label: 'Reports', href: '/reports', minTier: 'free' as const },
];

const featureNavItems = [
  { icon: Sparkles, label: 'Analysis', href: '/analysis', minTier: 'pro' as const, feature: 'hasAdvancedAnalytics' as const },
  { icon: BarChart3, label: 'Compare', href: '/players/compare', minTier: 'free' as const },
  { icon: List, label: 'Watchlists', href: '/watchlists', minTier: 'free' as const },
  { icon: MessageSquare, label: 'Contact', href: '/contact', minTier: 'free' as const },
];

const adminNavItems = [
  { icon: Shield, label: 'Admin', href: '/admin' },
];

const tierConfig = {
  free: { label: 'Free', icon: Sparkles, className: 'bg-secondary text-muted-foreground' },
  pro: { label: 'Pro', icon: Crown, className: 'bg-primary/10 text-primary' },
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const { tier, limits, isInTrial, trialDaysRemaining } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentTier = tierConfig[tier] || tierConfig.free;
  const TierIcon = currentTier.icon;

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const tierHierarchy = { free: 0, pro: 1 };
  const currentTierLevel = tierHierarchy[tier] || 0;

  const allNavItems = [
    ...baseNavItems,
    ...featureNavItems.filter(item => {
      const requiredTierLevel = tierHierarchy[item.minTier] || 0;
      if (currentTierLevel < requiredTierLevel) return false;
      if (item.feature && !limits[item.feature]) return false;
      return true;
    }),
    ...(isAdmin ? adminNavItems : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />

      {/* Desktop Sidebar - clean and minimal */}
      <aside data-tour="navigation" className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 pb-4">
            <Logo size="md" />
          </div>

          {/* Tier Badge */}
          <div className="px-4 mb-3">
            <Link
              to="/settings?tab=plan"
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                currentTier.className
              )}
            >
              <TierIcon className="w-4 h-4" />
              <span>{currentTier.label} Plan</span>
              {isInTrial && (
                <span className="text-xs opacity-75">({trialDaysRemaining}d left)</span>
              )}
            </Link>
          </div>

          {/* Controls */}
          <div className="px-4 mb-2 flex items-center justify-between">
            <SyncStatusIndicator />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationToggle />
            </div>
          </div>

          {/* Bulk Export */}
          <div className="px-4 mb-2">
            <BulkExportModal />
          </div>

          {/* Quick Action */}
          <div className="px-4 mb-4">
            <Button
              className="w-full justify-start"
              onClick={() => navigate('/players/new')}
            >
              <Plus className="w-4 h-4" />
              Add Player
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150',
                  location.pathname === item.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <Link to="/settings" className="flex items-center gap-3 mb-3 group">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
                <AvatarFallback className="bg-secondary text-muted-foreground text-sm font-medium">
                  {getInitials(profile?.full_name, profile?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-primary transition-colors">
                  {profile?.full_name || 'Scout'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-muted-foreground"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 lg:pt-0 min-h-screen pb-24 sm:pb-28 lg:pb-0 safe-area-bottom safe-area-top scroll-ios">
        <div className="responsive-padding py-4 sm:py-6 md:py-8 lg:py-10">
          <div className="content-container-lg">
            {children}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
