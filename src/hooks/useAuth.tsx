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

const SESSION_HEALTH_INTERVAL = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setRole(null);
    setRoleLoading(false);
  }, []);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[eRide Auth] Role fetch failed:", error.message);
        return null;
      }
      return (data?.role as AppRole) ?? null;
    } catch (error) {
      console.error("[eRide Auth] Unexpected role fetch error:", error);
      return null;
    }
  }, []);

  const stopHealthCheck = useCallback(() => {
    if (healthTimerRef.current) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
  }, []);

  const startHealthCheck = useCallback(() => {
    stopHealthCheck();
    healthTimerRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s) {
          console.warn("[eRide Auth] Health check: no session");
          clearAuthState();
          return;
        }
        const expiresAt = s.expires_at;
        if (expiresAt) {
          const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);
          if (secondsLeft < 120) {
            console.log("[eRide Auth] Proactive token refresh");
            await supabase.auth.refreshSession();
          }
        }
      } catch {
        // silent
      }
    }, SESSION_HEALTH_INTERVAL);
  }, [stopHealthCheck, clearAuthState]);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;
        console.log("[eRide Auth] Event:", event);

        if (event === "SIGNED_OUT") {
          clearAuthState();
          stopHealthCheck();
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          setSession(newSession);
          return;
        }

        // For SIGNED_IN and INITIAL_SESSION events
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setRoleLoading(true);
          const r = await fetchRole(newSession.user.id);
          if (mountedRef.current) {
            setRole(r);
            setRoleLoading(false);
            setLoading(false);
            startHealthCheck();
          }
        } else {
          clearAuthState();
          stopHealthCheck();
          if (mountedRef.current) setLoading(false);
        }
      }
    );

    // 2. Check existing session
    (async () => {
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (existing?.user) {
        // Validate server-side
        const { data: { user: validUser }, error } = await supabase.auth.getUser();
        if (!validUser || error) {
          console.warn("[eRide Auth] Stale session — clearing");
          await supabase.auth.signOut();
          clearAuthState();
          setLoading(false);
          return;
        }
        setSession(existing);
        setUser(existing.user);
        setRoleLoading(true);
        const r = await fetchRole(existing.user.id);
        if (mountedRef.current) {
          setRole(r);
          setRoleLoading(false);
          setLoading(false);
          startHealthCheck();
        }
      } else {
        clearAuthState();
        setLoading(false);
      }
      initDoneRef.current = true;
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      stopHealthCheck();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    stopHealthCheck();
    await supabase.auth.signOut();
    clearAuthState();
  }, [clearAuthState, stopHealthCheck]);

  const navigateToRoleHome = useCallback((r?: AppRole | null) => {
    const target = r ?? role;
    if (target === "driver") window.location.href = "/driver";
    else if (target === "rider") window.location.href = "/rider";
    else if (target === "manager" || target === "super_admin") window.location.href = "/manager";
    else if (target === "admin" || target === "operations_manager" || target === "support_agent" || target === "finance") {
      window.location.href = "/admin/overview";
    } else {
      window.location.href = "/onboarding";
    }
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, roleLoading, signOut, navigateToRoleHome }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
