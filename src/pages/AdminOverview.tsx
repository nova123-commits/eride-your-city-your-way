import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ERideLogo from "@/components/ERideLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Users, Car, Clock, CheckCircle2, TrendingUp,
} from "lucide-react";
import AdminAnalytics from "@/components/AdminAnalytics";

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalRiders: 0,
    pendingVerifications: 0,
    activeRides: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Count drivers
      const { count: driverCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "driver");

      // Count riders
      const { count: riderCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "rider");

      // Pending verifications from localStorage (simulated)
      const apps = JSON.parse(localStorage.getItem("eride_driver_applications") || "[]");
      const pending = apps.filter((a: any) => a.status === "pending").length;

      setStats({
        totalDrivers: driverCount ?? 0,
        totalRiders: riderCount ?? 0,
        pendingVerifications: pending,
        activeRides: Math.floor(Math.random() * 12) + 3, // simulated
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Active Rides", value: stats.activeRides, icon: Car, color: "text-primary" },
    { label: "Registered Drivers", value: stats.totalDrivers, icon: Users, color: "text-accent-foreground" },
    { label: "Registered Riders", value: stats.totalRiders, icon: TrendingUp, color: "text-primary" },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: Clock, color: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform health at a glance.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <card.icon className={`w-5 h-5 mb-2 ${card.color}`} />
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <AdminAnalytics />

        {stats.pendingVerifications > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {stats.pendingVerifications} driver(s) awaiting verification
                </p>
                <a href="/admin/approvals" className="text-xs text-primary hover:underline">
                  Review now →
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
