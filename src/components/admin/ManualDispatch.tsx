import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, MapPin, User, Car, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OnlineDriver {
  driver_id: string;
  full_name: string | null;
  vehicle_info: string;
  plate: string;
}

export default function ManualDispatch() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [drivers, setDrivers] = useState<OnlineDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineDrivers = async () => {
      // Get online driver locations
      const { data: locations } = await supabase
        .from("driver_locations")
        .select("driver_id")
        .eq("is_online", true);

      if (!locations || locations.length === 0) {
        setDrivers([]);
        setLoading(false);
        return;
      }

      const driverIds = locations.map(l => l.driver_id);

      const [profilesRes, vehiclesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", driverIds),
        supabase.from("vehicles").select("driver_id, make, model, plate_number").in("driver_id", driverIds).eq("is_active", true),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));
      const vehicleMap = new Map((vehiclesRes.data || []).map(v => [v.driver_id, v]));

      const enriched: OnlineDriver[] = driverIds.map(id => {
        const v = vehicleMap.get(id);
        return {
          driver_id: id,
          full_name: profileMap.get(id) || null,
          vehicle_info: v ? `${v.make} ${v.model}` : "No vehicle",
          plate: v?.plate_number || "—",
        };
      });

      setDrivers(enriched);
      setLoading(false);
    };

    fetchOnlineDrivers();
  }, []);

  const handleDispatch = async () => {
    if (!pickup || !destination || !selectedDriver || !user) {
      toast({ title: "Fill all fields", description: "Select pickup, destination, and a driver.", variant: "destructive" });
      return;
    }
    setDispatching(true);

    // Create a ride and assign the driver directly
    const { data, error } = await supabase.from("rides").insert({
      rider_id: user.id, // admin-created ride
      pickup_address: pickup,
      destination_address: destination,
      driver_id: selectedDriver,
      status: "driver_assigned",
      category: "basic",
      estimated_fare: 0,
    }).select("id").single();

    if (error) {
      toast({ title: "Dispatch failed", description: error.message, variant: "destructive" });
    } else {
      const driverName = drivers.find(d => d.driver_id === selectedDriver)?.full_name || "Driver";
      toast({ title: "Trip Dispatched ✓", description: `Assigned to ${driverName}` });
      setPickup("");
      setDestination("");
      setSelectedDriver(null);
    }
    setDispatching(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Manual Dispatch</h2>
      </div>
      <p className="text-xs text-muted-foreground">Assign trips to specific drivers for VIP/Corporate clients.</p>

      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
          <Input placeholder="Pickup location" value={pickup} onChange={e => setPickup(e.target.value)} className="pl-9" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-destructive" />
          <Input placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Select Driver</p>
        {loading ? (
          <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No drivers online.</p>
        ) : (
          drivers.map(driver => (
            <Card
              key={driver.driver_id}
              className={`border-border/60 cursor-pointer transition-all ${selectedDriver === driver.driver_id ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"}`}
              onClick={() => setSelectedDriver(driver.driver_id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{driver.full_name || "Unnamed"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Car className="w-3 h-3" /> {driver.vehicle_info} · {driver.plate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button className="w-full gap-2" onClick={handleDispatch} disabled={dispatching || !selectedDriver}>
        <Send className="w-4 h-4" />
        {dispatching ? "Dispatching..." : "Dispatch Trip"}
      </Button>
    </div>
  );
}
