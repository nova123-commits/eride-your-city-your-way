import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Car, Bike, Mail, Lock, User, ArrowLeft } from "lucide-react";

import { Link } from "react-router-dom";

type AuthMode = "login" | "signup";
type RoleChoice = "rider" | "driver";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("rider");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
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
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
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

        const role = roleData?.role ?? "rider";
        if (role === "driver") navigate("/driver", { replace: true });
        else if (role === "admin") navigate("/admin/overview", { replace: true });
        else navigate("/rider", { replace: true });
      }
    }
    setLoading(false);
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
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
