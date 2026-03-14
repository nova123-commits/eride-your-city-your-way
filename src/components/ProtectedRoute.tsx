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

  console.log("Session:", session);
  console.log("Role:", role);
  console.log("[eRide Guard]", {
    path: location.pathname,
    userId: user?.id ?? "none",
    loading,
    roleLoading,
    allowedRoles: allowedRoles ?? "any",
  });

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

  if (!session || !user) {
    console.warn("[eRide Guard] No valid session — redirecting to /auth");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!role) {
    if (allowNoRole) return <>{children}</>;
    console.warn("[eRide Guard] User has no role — redirecting to /onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`[eRide Guard] STRICT BLOCK: Role "${role}" cannot access ${location.pathname}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
