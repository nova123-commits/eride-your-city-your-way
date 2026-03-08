import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "rider" | "driver" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
  /** Redirect user to their role-based home page */
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole> => {
    setRoleLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .single();
      const r = (data?.role as AppRole) ?? "rider";
      setRole(r);
      return r;
    } catch {
      setRole("rider");
      return "rider";
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        console.log("[eRide Auth] onAuthStateChange event:", _event, "user:", session?.user?.id ?? "none");
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setRole(null);
          setRoleLoading(true);
          const freshRole = await fetchRole(session.user.id);
          console.log("[eRide Auth] onAuthStateChange -> DB role:", freshRole, "| user_metadata.role:", session.user.user_metadata?.role, "| userId:", session.user.id);
        } else {
          setRole(null);
          setRoleLoading(false);
        }
        if (mounted) setLoading(false);
      }
    );

    // THEN check existing session — and validate it's still valid
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        // Validate user still exists by checking with getUser()
        const { data: { user: validUser }, error } = await supabase.auth.getUser();
        if (!validUser || error) {
          console.warn("[eRide Auth] Stale session detected — clearing");
          await supabase.auth.signOut();
          localStorage.clear();
          setSession(null);
          setUser(null);
          setRole(null);
          setRoleLoading(false);
          if (mounted) setLoading(false);
          window.location.href = "/";
          return;
        }
      }
      console.log("[eRide Auth] getSession -> user:", session?.user?.id ?? "none");
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setRole(null);
        setRoleLoading(true);
        const freshRole = await fetchRole(session.user.id);
        console.log("[eRide Auth] getSession -> DB role:", freshRole, "| userId:", session.user.id);
      } else {
        setRoleLoading(false);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  }, []);

  const navigateToRoleHome = useCallback((r?: AppRole | null) => {
    const target = r ?? role;
    if (target === "driver") window.location.href = "/driver";
    else if (target === "admin") window.location.href = "/admin/overview";
    else window.location.href = "/rider";
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, roleLoading, signOut, navigateToRoleHome }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
