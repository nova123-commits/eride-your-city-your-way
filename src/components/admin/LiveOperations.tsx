import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Navigation, Users } from "lucide-react";
import { motion } from "framer-motion";
import LiveMap from "@/components/map/LiveMap";

interface MockDriver {
  id: string;
  name: string;
  status: "online" | "on_trip";
  location: string;
  position: { top: string; left: string };
  destination?: string;
}

const MOCK_DRIVERS: MockDriver[] = [
  { id: "1", name: "James Mwangi", status: "on_trip", location: "Westlands", position: { top: "22%", left: "35%" }, destination: "CBD" },
  { id: "2", name: "Faith Wanjiku", status: "online", location: "Kilimani", position: { top: "48%", left: "42%" } },
  { id: "3", name: "Peter Ochieng", status: "on_trip", location: "Eastleigh", position: { top: "30%", left: "68%" }, destination: "South B" },
  { id: "4", name: "Grace Akinyi", status: "online", location: "Karen", position: { top: "72%", left: "28%" } },
  { id: "5", name: "David Kamau", status: "online", location: "Langata", position: { top: "65%", left: "52%" } },
  { id: "6", name: "Sarah Njeri", status: "on_trip", location: "CBD", position: { top: "42%", left: "50%" }, destination: "Westlands" },
];

export default function LiveOperations() {
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [selected, setSelected] = useState<MockDriver | null>(null);

  // Simulate status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        position: {
          top: `${parseFloat(d.position.top) + (Math.random() - 0.5) * 2}%`,
          left: `${parseFloat(d.position.left) + (Math.random() - 0.5) * 2}%`,
        }
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = drivers.filter(d => d.status === "online").length;
  const onTripCount = drivers.filter(d => d.status === "on_trip").length;

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
            <p className="text-[10px] text-muted-foreground">Total Drivers</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-3 text-center">
            <Car className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-primary">{onlineCount}</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
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
        <CardContent className="p-0 relative h-72 bg-secondary">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />

          {drivers.map((driver) => (
            <motion.div
              key={driver.id}
              className="absolute cursor-pointer"
              style={{ top: driver.position.top, left: driver.position.left }}
              animate={{ top: driver.position.top, left: driver.position.left }}
              transition={{ duration: 2, ease: "easeInOut" }}
              onClick={() => setSelected(driver)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg ${
                driver.status === "on_trip"
                  ? "bg-yellow-500/80 border-yellow-500"
                  : "bg-primary/80 border-primary"
              }`}>
                <Car className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              {driver.status === "on_trip" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </motion.div>
          ))}

          <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary/80" /> Online</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" /> On Trip</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected driver info */}
      {selected && (
        <Card className="border-primary/30">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.location}</p>
              </div>
              <Badge variant={selected.status === "on_trip" ? "secondary" : "default"} className="text-xs">
                {selected.status === "on_trip" ? `→ ${selected.destination}` : "Available"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver list */}
      <div className="space-y-1.5">
        {drivers.map(d => (
          <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted" onClick={() => setSelected(d)}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${d.status === "on_trip" ? "bg-yellow-500" : "bg-primary"}`} />
              <span className="font-medium text-foreground">{d.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{d.location}{d.destination ? ` → ${d.destination}` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
