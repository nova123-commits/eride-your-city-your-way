import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Navigation, Users, Loader2 } from "lucide-react";
import LiveMap from "@/components/map/LiveMap";
import { supabase } from "@/integrations/supabase/client";

interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  heading: number | null;
  speed: number | null;
  updated_at: string;
  profile?: { full_name: string | null };
  activeRide?: { destination_address: string } | null;
}

export default function LiveOperations() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DriverLocation | null>(null);

  const fetchDrivers = async () => {
    // Get all online driver locations
    const { data: locations } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("is_online", true);

    if (!locations || locations.length === 0) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    // Get profiles for these drivers
    const driverIds = locations.map(l => l.driver_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", driverIds);

    // Get active rides for these drivers
    const { data: activeRides } = await supabase
      .from("rides")
      .select("driver_id, destination_address")
      .in("driver_id", driverIds)
      .in("status", ["driver_assigned", "ride_started"]);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const rideMap = new Map((activeRides || []).map(r => [r.driver_id!, r]));

    const enriched: DriverLocation[] = locations.map(loc => ({
      ...loc,
      profile: profileMap.get(loc.driver_id) || { full_name: null },
      activeRide: rideMap.get(loc.driver_id) || null,
    }));

    setDrivers(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();

    // Realtime subscription for driver location updates
    const channel = supabase
      .channel("admin-live-ops")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => {
        fetchDrivers();
      })
      .subscribe();

    // Refresh every 30s as fallback
    const interval = setInterval(fetchDrivers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const onlineCount = drivers.filter(d => !d.activeRide).length;
  const onTripCount = drivers.filter(d => !!d.activeRide).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Live Operations</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{drivers.length}</p>
            <p className="text-[10px] text-muted-foreground">Online Drivers</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-3 text-center">
            <Car className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-primary">{onlineCount}</p>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <Navigation className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold text-yellow-500">{onTripCount}</p>
            <p className="text-[10px] text-muted-foreground">On Trip</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Map */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0 relative h-72">
          <LiveMap className="h-full w-full" followUser={false} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : drivers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No drivers online right now.</p>
      ) : (
        <>
          {/* Selected driver info */}
          {selected && (
            <Card className="border-primary/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selected.profile?.full_name || "Unknown Driver"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                    </p>
                  </div>
                  <Badge variant={selected.activeRide ? "secondary" : "default"} className="text-xs">
                    {selected.activeRide ? `→ ${selected.activeRide.destination_address}` : "Available"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Driver list */}
          <div className="space-y-1.5">
            {drivers.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted"
                onClick={() => setSelected(d)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${d.activeRide ? "bg-yellow-500" : "bg-primary"}`} />
                  <span className="font-medium text-foreground">{d.profile?.full_name || "Driver"}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {d.activeRide ? `→ ${d.activeRide.destination_address}` : "Available"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
