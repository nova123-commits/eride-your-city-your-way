import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"rider" | "driver" | "admin">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, roleLoading } = useAuth();

  // Wait for BOTH auth session AND role to be resolved before any redirect
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Role is loaded but null shouldn't happen — fallback
  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  // Admins can access ALL pages
  if (role === "admin") {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to role-specific home — prevents cross-role access
    if (role === "rider") return <Navigate to="/rider" replace />;
    if (role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
