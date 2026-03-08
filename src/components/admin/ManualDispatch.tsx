import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, MapPin, User, Car } from "lucide-react";

const MOCK_DRIVERS = [
  { id: "d1", name: "James Mwangi", vehicle: "Toyota Vitz · KCB 123A", rating: 4.9, distance: "0.8 km" },
  { id: "d2", name: "Grace Wanjiku", vehicle: "Suzuki Alto · KDA 456B", rating: 4.7, distance: "1.2 km" },
  { id: "d3", name: "Peter Ochieng", vehicle: "Honda Fit · KCE 789C", rating: 4.8, distance: "1.5 km" },
];

export default function ManualDispatch() {
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const handleDispatch = () => {
    if (!pickup || !destination || !selectedDriver) {
      toast({ title: "Fill all fields", description: "Select pickup, destination, and a driver.", variant: "destructive" });
      return;
    }
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      toast({ title: "Trip Dispatched ✓", description: `Assigned to ${MOCK_DRIVERS.find(d => d.id === selectedDriver)?.name}` });
      setPickup("");
      setDestination("");
      setSelectedDriver(null);
    }, 1200);
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
        {MOCK_DRIVERS.map(driver => (
          <Card
            key={driver.id}
            className={`border-border/60 cursor-pointer transition-all ${selectedDriver === driver.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"}`}
            onClick={() => setSelectedDriver(driver.id)}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{driver.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Car className="w-3 h-3" /> {driver.vehicle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">⭐ {driver.rating}</p>
                <p className="text-[10px] text-muted-foreground">{driver.distance}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full gap-2" onClick={handleDispatch} disabled={dispatching}>
        <Send className="w-4 h-4" />
        {dispatching ? "Dispatching..." : "Dispatch Trip"}
      </Button>
    </div>
  );
}
