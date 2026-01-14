import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireTeamOwnerOrAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireTeamOwnerOrAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, profile } = useAuth();
  const location = useLocation();

  // Check if user is a team owner (has team_role of team_admin)
  const isTeamOwner = profile?.team_role === 'team_admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireTeamOwnerOrAdmin && !isAdmin && !isTeamOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
