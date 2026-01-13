import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Shield,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Users, label: 'Players', href: '/players' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: BarChart3, label: 'Compare', href: '/players/compare' },
];

const adminNavItems = [
  { icon: Shield, label: 'Admin', href: '/admin' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin, profile } = useAuth();

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  // For admin, add Admin before Settings
  const displayItems = isAdmin 
    ? [...navItems, adminNavItems[0]]
    : navItems;

  const isSettingsActive = location.pathname === '/settings' || location.pathname.startsWith('/settings');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {displayItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        
        {/* Profile/Settings with Avatar */}
        <Link
          to="/settings"
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
            isSettingsActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Avatar className={cn(
            'h-5 w-5 transition-transform',
            isSettingsActive && 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background'
          )}>
            <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name || 'Profile'} />
            <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
              {getInitials(profile?.full_name, profile?.email)}
            </AvatarFallback>
          </Avatar>
          <span className={cn(
            'text-[10px] font-medium',
            isSettingsActive && 'font-semibold'
          )}>
            Profile
          </span>
          {isSettingsActive && (
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
          )}
        </Link>
      </div>
    </nav>
  );
}
