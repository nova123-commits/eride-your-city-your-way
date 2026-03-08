import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Car, Bike, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type AuthMode = "login" | "signup";
type RoleChoice = "rider" | "driver";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading, roleLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("rider");
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // If already authenticated and role is loaded, redirect to role home
  if (!loading && !roleLoading && user && role) {
    if (role === "driver") return <Navigate to="/driver" replace />;
    if (role === "admin") return <Navigate to="/admin/overview" replace />;
    return <Navigate to="/rider" replace />;
  }

  // Show loader while auth state initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: roleChoice,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Check your email",
          description: "We've sent a confirmation link. Please verify your email to sign in.",
        });
      } else if (data.user && data.session) {
        // Auto-confirmed — redirect
        toast({ title: "Account created!", description: "Welcome to eRide." });
        if (roleChoice === "driver") navigate("/driver", { replace: true });
        else navigate("/rider", { replace: true });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else if (data.user) {
        // Fetch role and redirect
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .limit(1)
          .single();

        const r = roleData?.role ?? "rider";
        if (r === "driver") navigate("/driver", { replace: true });
        else if (r === "admin") navigate("/admin/overview", { replace: true });
        else navigate("/rider", { replace: true });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <ERideLogo size="lg" />
        <p className="text-muted-foreground mt-2 text-sm">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {mode === "signup" && (
          <>
            {/* Role selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Are you a Rider or a Driver?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleChoice("rider")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    roleChoice === "rider"
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Car className={`w-6 h-6 ${roleChoice === "rider" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold text-sm ${roleChoice === "rider" ? "text-primary" : "text-foreground"}`}>
                    Rider
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleChoice("driver")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    roleChoice === "driver"
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Bike className={`w-6 h-6 ${roleChoice === "driver" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold text-sm ${roleChoice === "driver" ? "text-primary" : "text-foreground"}`}>
                    Driver
                  </span>
                </button>
              </div>
            </div>

            {/* Full name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            minLength={6}
            required
          />
        </div>

        {mode === "signup" && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the eRide{" "}
              <Link to="/legal" className="text-primary font-medium hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/legal" className="text-primary font-medium hover:underline">Privacy Policy</Link>
            </span>
          </label>
        )}

        <Button type="submit" className="w-full" disabled={submitting || (mode === "signup" && !agreedToTerms)}>
          {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.form>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/")}
        className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to home
      </motion.button>
    </div>
  );
}
