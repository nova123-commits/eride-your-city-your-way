import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DriverEarningsSummary {
  todayEarnings: number;
  weeklyTotal: number;
  totalTrips: number;
  dailyData: { day: string; earnings: number }[];
}

export interface PayoutRecord {
  id: string;
  amount: number;
  commission: number;
  net_amount: number;
  status: string;
  created_at: string;
}

export function useDriverEarnings() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DriverEarningsSummary>({
    todayEarnings: 0, weeklyTotal: 0, totalTrips: 0, dailyData: [],
  });
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      // Get completed rides as driver
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [todayRes, weekRes, payoutRes] = await Promise.all([
        supabase.from("rides")
          .select("final_fare")
          .eq("driver_id", user.id)
          .eq("status", "ride_completed")
          .gte("completed_at", startOfDay),
        supabase.from("rides")
          .select("final_fare, completed_at")
          .eq("driver_id", user.id)
          .eq("status", "ride_completed")
          .gte("completed_at", startOfWeek),
        supabase.from("driver_payouts")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const todayEarnings = (todayRes.data ?? []).reduce((s, r) => s + (Number(r.final_fare) || 0), 0);
      const weekRides = weekRes.data ?? [];
      const weeklyTotal = weekRides.reduce((s, r) => s + (Number(r.final_fare) || 0), 0);

      // Build daily breakdown
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyMap: Record<string, number> = {};
      days.forEach(d => dailyMap[d] = 0);
      weekRides.forEach(r => {
        if (r.completed_at) {
          const day = days[new Date(r.completed_at).getDay()];
          dailyMap[day] += Number(r.final_fare) || 0;
        }
      });

      setSummary({
        todayEarnings,
        weeklyTotal,
        totalTrips: weekRides.length,
        dailyData: days.map(d => ({ day: d, earnings: dailyMap[d] })),
      });

      setPayouts((payoutRes.data ?? []) as PayoutRecord[]);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { summary, payouts, loading };
}
