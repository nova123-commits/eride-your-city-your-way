import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { RideCategory } from "@/lib/ride";

interface CreateRideParams {
  pickup: string;
  destination: string;
  pickupLat?: number;
  pickupLng?: number;
  destLat?: number;
  destLng?: number;
  category: RideCategory;
  estimatedFare: number;
  paymentMethod?: string;
  distanceKm?: number;
  surgeMultiplier?: number;
}

export function useRideRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rideId, setRideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createRide = useCallback(
    async (params: CreateRideParams): Promise<string | null> => {
      if (!user) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return null;
      }
      setLoading(true);
      try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const { data, error } = await supabase
          .from("rides")
          .insert({
            rider_id: user.id,
            pickup_address: params.pickup,
            destination_address: params.destination,
            pickup_lat: params.pickupLat ?? -1.2921,
            pickup_lng: params.pickupLng ?? 36.8219,
            destination_lat: params.destLat ?? -1.3192,
            destination_lng: params.destLng ?? 36.9275,
            category: params.category.id,
            estimated_fare: params.estimatedFare,
            payment_method: params.paymentMethod ?? "cash",
            distance_km: params.distanceKm ?? 7.2,
            surge_multiplier: params.surgeMultiplier ?? 1,
            otp_code: otp,
            status: "requested",
          })
          .select("id")
          .single();

        if (error) throw error;
        setRideId(data.id);
        return data.id;
      } catch (err: any) {
        console.error("[useRideRequest] createRide error:", err);
        toast({ title: "Failed to request ride", description: err.message, variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  const cancelRide = useCallback(
    async (id?: string) => {
      const targetId = id ?? rideId;
      if (!targetId || !user) return;
      try {
        await supabase
          .from("rides")
          .update({ status: "cancelled", cancelled_by: "rider", cancel_reason: "Rider cancelled", updated_at: new Date().toISOString() })
          .eq("id", targetId)
          .eq("rider_id", user.id);
        setRideId(null);
      } catch (err: any) {
        console.error("[useRideRequest] cancelRide error:", err);
      }
    },
    [rideId, user]
  );

  return { rideId, loading, createRide, cancelRide, setRideId };
}
