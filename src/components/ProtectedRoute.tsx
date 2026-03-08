import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"rider" | "driver" | "admin">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, roleLoading } = useAuth();
  const location = useLocation();

  // === DIAGNOSTIC LOG ===
  console.log("[eRide Guard]", {
    path: location.pathname,
    userId: user?.id ?? "none",
    role,
    loading,
    roleLoading,
    allowedRoles: allowedRoles ?? "any",
  });

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
    console.warn("[eRide Guard] No user session — redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // No role in DB — send to /auth so they can re-register properly
  if (!role) {
    console.warn("[eRide Guard] Role is null after loading completed — redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Debug overlay (temporary) — visible in bottom-right corner
  const debugOverlay = (
    <div className="fixed bottom-1 right-1 z-[9999] bg-black/80 text-[10px] text-green-400 px-2 py-1 rounded font-mono pointer-events-none">
      Role: {role} | Path: {location.pathname}
    </div>
  );

  // Admins can access ALL pages
  if (role === "admin") {
    return <>{debugOverlay}{children}</>;
  }

  // STRICT: if route requires specific roles and user doesn't match, redirect to THEIR role home (not /auth)
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`[eRide Guard] STRICT BLOCK: Role "${role}" cannot access ${location.pathname} (allowed: [${allowedRoles}])`);
    if (role === "rider") return <Navigate to="/rider" replace />;
    if (role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{debugOverlay}{children}</>;
}
