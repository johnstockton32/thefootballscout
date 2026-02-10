import { ReactNode, forwardRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  ({ children, requireAdmin = false }, ref) => {
    const { user, profile, isLoading, isAdmin } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return (
        <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
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

    // New Google users without GDPR consent need to complete signup
    if (profile && !profile.gdpr_consent && location.pathname !== '/gdpr-consent') {
      return <Navigate to="/auth?mode=signUp&complete=true" replace />;
    }

    if (requireAdmin && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);

ProtectedRoute.displayName = 'ProtectedRoute';