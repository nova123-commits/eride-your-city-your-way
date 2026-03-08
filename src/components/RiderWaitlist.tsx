import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Bell, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const cities = ["Nakuru", "Mombasa", "Kisumu", "Eldoret", "Thika"];

export default function RiderWaitlist() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone || !city) return;
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({ phone, city });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Could not join waitlist.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "You're on the list!", description: `We'll SMS you when eRide launches in ${city}.` });
    }
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <div className="brand-gradient px-5 py-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Bell className="w-5 h-5" />
            <h3 className="font-bold text-sm">Coming Soon to Your City!</h3>
          </div>
          <p className="text-primary-foreground/80 text-xs mt-1">
            Sign up to get 50% off your first ride when we launch in your area.
          </p>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground">You're on the waitlist!</p>
                <p className="text-xs text-muted-foreground">
                  We'll send an SMS to {phone} when eRide launches in {city}.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        city === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {c}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary border-border"
                />
                <Button
                  className="w-full brand-gradient text-primary-foreground font-bold btn-press"
                  onClick={handleSubmit}
                  disabled={!phone || !city || loading}
                >
                  {loading ? "Joining..." : "Notify Me"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
