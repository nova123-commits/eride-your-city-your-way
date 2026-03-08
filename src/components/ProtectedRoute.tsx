import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"rider" | "driver" | "admin">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, roleLoading } = useAuth();

  // Wait for BOTH auth session AND role to be 100% resolved before any redirect
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
    console.warn("[eRide Guard] Role is null after loading completed — redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Debug overlay (temporary) — visible in bottom-right corner
  const debugOverlay = (
    <div className="fixed bottom-1 right-1 z-[9999] bg-black/80 text-[10px] text-green-400 px-2 py-1 rounded font-mono pointer-events-none">
      Role: {role}
    </div>
  );

  // Admins can access ALL pages
  if (role === "admin") {
    return <>{debugOverlay}{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`[eRide Guard] Role "${role}" not in allowedRoles [${allowedRoles}] — redirecting`);
    if (role === "rider") return <Navigate to="/rider" replace />;
    if (role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{debugOverlay}{children}</>;
}
