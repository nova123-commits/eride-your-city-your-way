import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RideStatus =
  | "requested"
  | "driver_assigned"
  | "driver_arriving"
  | "ride_started"
  | "ride_completed"
  | "cancelled";

export interface RideData {
  id: string;
  status: RideStatus;
  pickup_address: string;
  destination_address: string;
  category: string;
  estimated_fare: number;
  final_fare: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  driver_id: string | null;
  otp_code: string | null;
  surge_multiplier: number;
  payment_method: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DriverInfo {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface VehicleInfo {
  make: string;
  model: string;
  plate_number: string;
  color: string;
  category: string;
}

/**
 * Subscribe to realtime updates on a specific ride.
 * Also fetches driver profile + vehicle when driver is assigned.
 */
export function useRideRealtime(rideId: string | null) {
  const { user } = useAuth();
  const [ride, setRide] = useState<RideData | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);

  const fetchDriverInfo = useCallback(async (driverId: string) => {
    const [profileRes, vehicleRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", driverId).single(),
      supabase.from("vehicles").select("make, model, plate_number, color, category").eq("driver_id", driverId).eq("is_active", true).limit(1).maybeSingle(),
    ]);
    if (profileRes.data) setDriver(profileRes.data);
    if (vehicleRes.data) setVehicle(vehicleRes.data);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!rideId) { setRide(null); setDriver(null); setVehicle(null); return; }

    const fetchRide = async () => {
      const { data } = await supabase.from("rides").select("*").eq("id", rideId).single();
      if (data) {
        setRide(data as unknown as RideData);
        if (data.driver_id) fetchDriverInfo(data.driver_id);
      }
    };
    fetchRide();
  }, [rideId, fetchDriverInfo]);

  // Realtime subscription
  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const updated = payload.new as unknown as RideData;
          setRide(updated);
          if (updated.driver_id && !driver) {
            fetchDriverInfo(updated.driver_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, driver, fetchDriverInfo]);

  return { ride, driver, vehicle };
}
