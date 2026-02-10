import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Sparkles,
  List,
  BarChart3,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin, profile } = useAuth();
  const { limits } = useSubscription();

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  // Primary nav items (always shown in bottom bar)
  const primaryNavItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: Users, label: 'Players', href: '/players' },
    { icon: FileText, label: 'Reports', href: '/reports' },
  ];

  // Secondary nav items (shown in "More" menu)
  const secondaryNavItems = [
    { icon: BarChart3, label: 'Compare', href: '/players/compare', show: true },
    { icon: List, label: 'Watchlists', href: '/watchlists', show: true },
    { icon: MessageSquare, label: 'Contact', href: '/contact', show: true },
    { icon: Sparkles, label: 'Analysis', href: '/analysis', show: limits.hasAdvancedAnalytics },
    { icon: Shield, label: 'Admin', href: '/admin', show: isAdmin },
  ].filter(item => item.show);

  const isSettingsActive = location.pathname === '/settings' || location.pathname.startsWith('/settings');
  const isMoreActive = secondaryNavItems.some(item => 
    location.pathname === item.href || location.pathname.startsWith(item.href)
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border fixed-ios no-select tab-bar-ios">
      <div className="flex items-stretch justify-around h-16 px-1">
        {primaryNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-lg transition-all touch-target ios-active',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 transition-transform',
                  isActive && 'scale-110'
                )} />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium truncate max-w-full',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* More Menu - includes theme toggle and sync status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-lg transition-all touch-target ios-active',
                isMoreActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <div className="relative">
                <MoreHorizontal className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 transition-transform',
                  isMoreActive && 'scale-110'
                )} />
                {isMoreActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium',
                isMoreActive && 'font-semibold'
              )}>
                More
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-52 mb-2">
            {/* Quick controls */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Controls</span>
              <div className="flex items-center gap-1">
                <SyncStatusIndicator />
                <ThemeToggle />
              </div>
            </div>
            <DropdownMenuSeparator />
            {secondaryNavItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 w-full',
                      isActive && 'text-primary'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Profile/Settings with Avatar */}
        <Link
          to="/settings"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-lg transition-all touch-target ios-active',
            isSettingsActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          )}
        >
          <div className="relative">
            <Avatar className={cn(
              'h-5 w-5 sm:h-6 sm:w-6 transition-transform',
              isSettingsActive && 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background'
            )}>
              <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
              <AvatarFallback className="text-[8px] sm:text-[9px] bg-primary/20 text-primary font-bold">
                {getInitials(profile?.full_name, profile?.email)}
              </AvatarFallback>
            </Avatar>
            {isSettingsActive && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </div>
          <span className={cn(
            'text-[10px] sm:text-xs font-medium',
            isSettingsActive && 'font-semibold'
          )}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}