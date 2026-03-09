import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function ReAuthModal({ open, onOpenChange, onSuccess, title, description }: ReAuthModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReAuth = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        toast.error("Authentication failed. Check your password.");
        return;
      }

      toast.success("Re-authenticated successfully");
      setPassword("");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Re-authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            {title || "Re-authenticate"}
          </DialogTitle>
          <DialogDescription>
            {description || "This action requires password verification for security."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReAuth()}
            />
          </div>
          <Button onClick={handleReAuth} disabled={loading || !password.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Verify & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
