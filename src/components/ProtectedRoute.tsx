import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  allowNoRole?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, allowNoRole = false }: ProtectedRouteProps) {
  const { user, session, role, loading, roleLoading } = useAuth();
  const location = useLocation();

  // Wait for auth to resolve — never redirect while loading
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // No session → /auth
  if (!session || !user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // User has no role
  if (!role) {
    if (allowNoRole) return <>{children}</>;
    return <Navigate to="/onboarding" replace />;
  }

  // Role doesn't match allowed list
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to role's home instead of generic /
    if (role === "driver") return <Navigate to="/driver" replace />;
    if (role === "rider") return <Navigate to="/rider" replace />;
    if (role === "manager" || role === "super_admin") return <Navigate to="/manager" replace />;
    return <Navigate to="/admin/overview" replace />;
  }

  return <>{children}</>;
}
