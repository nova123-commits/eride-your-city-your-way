import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  trips_completed: number;
  bonus_paid: boolean;
  created_at: string;
}

export default function DriverReferral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Check for existing referral code
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      if (data && data.length > 0) {
        setReferralCode(data[0].referral_code);
        setReferrals(data);
      } else {
        // Generate a new code
        const code = `ERIDE-${user.id.slice(0, 6).toUpperCase()}`;
        const { error } = await supabase.from("referrals").insert({
          referrer_id: user.id,
          referral_code: code,
        });
        if (!error) setReferralCode(code);
      }
    };
    init();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const completedReferrals = referrals.filter((r) => r.status === "completed").length;
  const pendingReferrals = referrals.filter((r) => r.referred_id && r.status === "pending").length;
  const totalBonus = completedReferrals * 500;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Refer a Friend</h2>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Share your code with other drivers. When they complete 10 trips, you both earn <strong className="text-primary">KES 500</strong>!
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background rounded-xl px-4 py-3 font-mono font-bold text-foreground text-center tracking-widest border border-border">
              {referralCode || "..."}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Referred", value: referrals.filter((r) => r.referred_id).length, color: "text-foreground" },
          { label: "Completed", value: completedReferrals, color: "text-primary" },
          { label: "Bonus Earned", value: `KES ${totalBonus}`, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingReferrals > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <Users className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-foreground">
                <strong>{pendingReferrals}</strong> friend(s) still completing their 10 trips
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
