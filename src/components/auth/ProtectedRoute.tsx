import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type AppRole = 'client' | 'admin' | 'kitchen' | 'motoboy';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Save the current location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // User doesn't have required role, redirect to their appropriate panel
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'kitchen':
        return <Navigate to="/kitchen" replace />;
      case 'motoboy':
        return <Navigate to="/motoboy" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
