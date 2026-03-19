import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface IncomingRide {
  id: string;
  pickup_address: string;
  destination_address: string;
  category: string;
  estimated_fare: number;
  distance_km: number | null;
  otp_code: string | null;
  rider_id: string;
  status: string;
  surge_multiplier: number;
}

export function useDriverRides() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRide, setIncomingRide] = useState<IncomingRide | null>(null);
  const [activeRide, setActiveRide] = useState<IncomingRide | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Listen for new ride requests (realtime INSERT on rides with status=requested)
  useEffect(() => {
    if (!user || !isOnline) return;

    const channel = supabase
      .channel("driver-ride-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          const ride = payload.new as unknown as IncomingRide;
          if (ride.status === "requested" && !ride.driver_id) {
            setIncomingRide(ride);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isOnline]);

  // Listen for updates on the active ride
  useEffect(() => {
    if (!activeRide) return;

    const channel = supabase
      .channel(`driver-active-${activeRide.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${activeRide.id}` },
        (payload) => {
          const updated = payload.new as unknown as IncomingRide;
          setActiveRide(updated);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRide?.id]);

  const goOnline = useCallback(async () => {
    if (!user) return;
    // Upsert driver location
    await supabase.from("driver_locations").upsert(
      { driver_id: user.id, latitude: -1.2921, longitude: 36.8219, is_online: true, updated_at: new Date().toISOString() },
      { onConflict: "driver_id" }
    );
    setIsOnline(true);
  }, [user]);

  const goOffline = useCallback(async () => {
    if (!user) return;
    await supabase.from("driver_locations").update({ is_online: false, updated_at: new Date().toISOString() }).eq("driver_id", user.id);
    setIsOnline(false);
    setIncomingRide(null);
  }, [user]);

  const acceptRide = useCallback(async (rideId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("rides")
      .update({ driver_id: user.id, status: "driver_assigned", updated_at: new Date().toISOString() })
      .eq("id", rideId)
      .eq("status", "requested"); // prevent race condition

    if (error) {
      toast({ title: "Could not accept ride", description: error.message, variant: "destructive" });
      return false;
    }

    // Log status transition
    await supabase.from("ride_status_history").insert({
      ride_id: rideId, from_status: "requested", to_status: "driver_assigned", changed_by: user.id,
    });

    const { data: rideData } = await supabase.from("rides").select("*").eq("id", rideId).single();
    setActiveRide(rideData as unknown as IncomingRide);
    setIncomingRide(null);
    return true;
  }, [user, toast]);

  const updateRideStatus = useCallback(async (rideId: string, fromStatus: string, toStatus: string) => {
    if (!user) return false;
    const updates: Record<string, any> = { status: toStatus, updated_at: new Date().toISOString() };
    if (toStatus === "ride_started") updates.started_at = new Date().toISOString();
    if (toStatus === "ride_completed") updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from("rides").update(updates).eq("id", rideId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    await supabase.from("ride_status_history").insert({
      ride_id: rideId, from_status: fromStatus, to_status: toStatus, changed_by: user.id,
    });
    if (toStatus === "ride_completed") setActiveRide(null);
    return true;
  }, [user, toast]);

  const declineRide = useCallback(() => {
    setIncomingRide(null);
  }, []);

  return { incomingRide, activeRide, isOnline, goOnline, goOffline, acceptRide, declineRide, updateRideStatus, setActiveRide };
}
