import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "rider" | "driver" | "admin" | "manager" | "super_admin" | "operations_manager" | "support_agent" | "finance";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
  navigateToRoleHome: (role?: AppRole | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  roleLoading: true,
  signOut: async () => {},
  navigateToRoleHome: () => {},
});

const SESSION_HEALTH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setRole(null);
    setRoleLoading(false);
  }, []);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole> => {
    setRoleLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (error || !data?.role) {
        console.warn("[eRide Auth] Role fetch failed, defaulting to rider:", error?.message);
        setRole("rider");
        return "rider";
      }

      const r = data.role as AppRole;
      setRole(r);
      return r;
    } catch {
      setRole("rider");
      return "rider";
    } finally {
      setRoleLoading(false);
    }
  }, []);

  // Validate session is still valid server-side
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user: validUser }, error } = await supabase.auth.getUser();
      if (!validUser || error) {
        console.warn("[eRide Auth] Session validation failed:", error?.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // Periodic session health check
  const startHealthCheck = useCallback(() => {
    if (healthTimerRef.current) clearInterval(healthTimerRef.current);
    healthTimerRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.warn("[eRide Auth] Health check: session expired");
        clearAuthState();
        window.location.href = "/auth";
        return;
      }
      // Check token expiry — refresh proactively if within 2 minutes
      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);
        if (secondsLeft < 120) {
          console.log("[eRide Auth] Token expiring soon, refreshing...");
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("[eRide Auth] Token refresh failed:", error.message);
            clearAuthState();
            window.location.href = "/auth";
          }
        }
      }
    }, SESSION_HEALTH_INTERVAL);
  }, [clearAuthState]);

  const stopHealthCheck = useCallback(() => {
    if (healthTimerRef.current) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
  }, []);

  // Handle authenticated session
  const handleSession = useCallback(async (newSession: Session | null, source: string) => {
    if (!mountedRef.current) return;

    if (!newSession?.user) {
      console.log(`[eRide Auth] ${source}: No session`);
      clearAuthState();
      stopHealthCheck();
      if (mountedRef.current) setLoading(false);
      return;
    }

    setSession(newSession);
    setUser(newSession.user);
    setRole(null);
    setRoleLoading(true);

    const freshRole = await fetchRole(newSession.user.id);
    console.log(`[eRide Auth] ${source}: role=${freshRole}, user=${newSession.user.id}`);

    startHealthCheck();
    if (mountedRef.current) setLoading(false);
  }, [clearAuthState, fetchRole, startHealthCheck, stopHealthCheck]);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        console.log("[eRide Auth] Event:", event);

        if (event === "SIGNED_OUT") {
          clearAuthState();
          stopHealthCheck();
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          console.log("[eRide Auth] Token refreshed successfully");
          setSession(session);
          return;
        }

        await handleSession(session, `onAuthStateChange(${event})`);
      }
    );

    // 2. Then validate existing session
    (async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession?.user) {
        // Validate server-side that user still exists
        const valid = await validateSession();
        if (!valid) {
          console.warn("[eRide Auth] Stale session detected — clearing");
          await supabase.auth.signOut();
          clearAuthState();
          if (mountedRef.current) setLoading(false);
          window.location.href = "/auth";
          return;
        }
      }

      await handleSession(existingSession, "getSession");
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      stopHealthCheck();
    };
  }, [handleSession, clearAuthState, stopHealthCheck, validateSession]);

  const signOut = useCallback(async () => {
    stopHealthCheck();
    await supabase.auth.signOut();
    clearAuthState();
  }, [clearAuthState, stopHealthCheck]);

  const navigateToRoleHome = useCallback((r?: AppRole | null) => {
    const target = r ?? role;
    if (target === "driver") window.location.href = "/driver";
    else if (target === "admin") window.location.href = "/admin/overview";
    else if (target === "manager") window.location.href = "/manager";
    else window.location.href = "/rider";
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, roleLoading, signOut, navigateToRoleHome }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
