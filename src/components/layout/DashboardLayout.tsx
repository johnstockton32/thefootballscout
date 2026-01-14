import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MobileBottomNav } from './MobileBottomNav';
import { useSubscription } from '@/hooks/useSubscription';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  Shield,
  Crown,
  Sparkles,
  Building2,
  List,
  Activity,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Players', href: '/players' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: BarChart3, label: 'Compare', href: '/players/compare' },
];

const secondaryNavItems = [
  { icon: List, label: 'Watchlists', href: '/watchlists' },
  { icon: Activity, label: 'Team Feed', href: '/team-feed' },
  { icon: BarChart3, label: 'Team Analytics', href: '/team-analytics' },
];

const teamOwnerNavItems = [
  { icon: Crown, label: 'Team Admin', href: '/teams-admin' },
];

const adminNavItems = [
  { icon: Shield, label: 'Admin', href: '/admin' },
];

const tierConfig = {
  free: { label: 'Free', icon: Sparkles, className: 'bg-muted text-muted-foreground' },
  pro: { label: 'Pro', icon: Crown, className: 'bg-primary/20 text-primary' },
  team: { label: 'Team', icon: Users, className: 'bg-accent text-accent-foreground' },
  agency: { label: 'Agency', icon: Building2, className: 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary' },
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const { tier, isInTrial, trialDaysRemaining } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is a team owner (has team_role of team_admin)
  const isTeamOwner = profile?.team_role === 'team_admin';

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

  // Build navigation items based on user role
  let allNavItems = [...navItems, ...secondaryNavItems];
  if (isTeamOwner) {
    allNavItems = [...allNavItems, ...teamOwnerNavItems];
  }
  if (isAdmin) {
    allNavItems = [...allNavItems, ...adminNavItems];
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {/* Mobile Tier Badge */}
            <Link
              to="/settings?tab=plan"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                currentTier.className
              )}
            >
              <TierIcon className="w-3.5 h-3.5" />
              <span>{currentTier.label}</span>
              {isInTrial && <span className="text-[10px] opacity-75">Trial</span>}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu */}
      <nav
        className={cn(
          'lg:hidden fixed top-16 left-0 right-0 z-50 bg-card border-b border-border transition-transform duration-300',
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="p-4 space-y-2">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                location.pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          <div className="border-t border-border my-2" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <Logo size="md" />
          </div>

          {/* Tier Badge */}
          <div className="px-4 mb-4">
            <Link
              to="/settings?tab=plan"
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80',
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

          {/* Quick Action */}
          <div className="px-4 mb-4">
            <Button
              variant="hero"
              className="w-full justify-start"
              onClick={() => navigate('/players/new')}
            >
              <Plus className="w-4 h-4" />
              Add Player
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  location.pathname === item.href
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                <ChevronRight 
                  className={cn(
                    'w-4 h-4 ml-auto opacity-0 -translate-x-2 transition-all',
                    location.pathname === item.href && 'opacity-100 translate-x-0'
                  )} 
                />
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <Link to="/settings" className="flex items-center gap-3 mb-4 group">
              <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary transition-colors">
                <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
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
                className="flex-1 justify-start text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
