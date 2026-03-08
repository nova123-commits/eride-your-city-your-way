import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign, Zap, HeadphonesIcon, ShieldCheck, Car, TrendingUp, ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Only 15% Commission",
    desc: "Keep more of every fare — lower than any competitor in Kenya.",
  },
  {
    icon: Zap,
    title: "Instant M-Pesa Payouts",
    desc: "Withdraw earnings to M-Pesa in seconds, no waiting period.",
  },
  {
    icon: HeadphonesIcon,
    title: "Premium Driver Support",
    desc: "24/7 dedicated support line and in-app help for drivers.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance & Safety",
    desc: "Comprehensive trip insurance and SOS button on every ride.",
  },
];

const stats = [
  { value: "2,500+", label: "Active Drivers" },
  { value: "83.5%", label: "Take-Home Rate" },
  { value: "< 30s", label: "M-Pesa Payout" },
];

export default function DriveWithUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-10" />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-16 safe-top">
          <div className="flex items-center justify-between mb-12">
            <ERideLogo size="md" />
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Car className="w-3.5 h-3.5" /> Now Recruiting in Nairobi
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              Drive with eRide.<br />
              <span className="text-brand-gradient">Earn more.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Join Kenya's fastest-growing ride platform. Lower commission, instant payouts, and a community that puts drivers first.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                size="lg"
                className="brand-gradient text-primary-foreground font-bold gap-2 btn-press"
                onClick={() => navigate("/auth?role=driver")}
              >
                Start Application <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
                I'm a Rider
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="max-w-3xl mx-auto px-5 py-8 grid grid-cols-3 gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why eRide */}
      <section className="max-w-3xl mx-auto px-5 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Why eRide?</h2>
        <p className="text-sm text-muted-foreground mb-8">Everything you need to earn on your terms.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/60 h-full">
                <CardContent className="p-5">
                  <b.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-5 py-12 text-center">
          <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Earn up to KES 8,000/day</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Top drivers on eRide earn more because they keep more. With only 15% commission, your hustle pays off.
          </p>
          <Button
            size="lg"
            className="brand-gradient text-primary-foreground font-bold gap-2 btn-press"
            onClick={() => navigate("/auth?role=driver")}
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-5 py-8 text-center">
        <ERideLogo size="sm" />
        <p className="text-xs text-muted-foreground mt-3">© 2026 eRide. All rights reserved.</p>
      </footer>
    </div>
  );
}
