import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type AppRole = 'client' | 'admin' | 'kitchen' | 'motoboy';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
}

// Helper function to get the correct route for a role
function getRouteForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'kitchen':
      return '/kitchen';
    case 'motoboy':
      return '/motoboy';
    default:
      return '/';
  }
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth or role is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated but role not yet loaded (edge case)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Get the correct route for this user's role
    const targetRoute = getRouteForRole(role);
    
    // Prevent redirect loop - only redirect if we're not already on the target route
    if (location.pathname !== targetRoute && !location.pathname.startsWith(targetRoute + '/')) {
      return <Navigate to={targetRoute} replace />;
    }
  }

  return <Outlet />;
}
