import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MapPin, Flame } from "lucide-react";

const ZONES = [
  { area: "Westlands", ghostRequests: 142, lat: "top-[18%] left-[28%]", demand: "high" },
  { area: "Kilimani", ghostRequests: 78, lat: "top-[42%] left-[48%]", demand: "medium" },
  { area: "Eastleigh", ghostRequests: 215, lat: "top-[28%] left-[68%]", demand: "critical" },
  { area: "Karen", ghostRequests: 25, lat: "top-[68%] left-[22%]", demand: "low" },
  { area: "CBD", ghostRequests: 110, lat: "top-[48%] left-[42%]", demand: "high" },
  { area: "Langata", ghostRequests: 45, lat: "top-[62%] left-[52%]", demand: "medium" },
  { area: "Upperhill", ghostRequests: 62, lat: "top-[55%] left-[35%]", demand: "medium" },
  { area: "Kasarani", ghostRequests: 180, lat: "top-[15%] left-[55%]", demand: "critical" },
  { area: "South B", ghostRequests: 33, lat: "top-[72%] left-[60%]", demand: "low" },
];

function getHeatStyle(demand: string) {
  switch (demand) {
    case "critical": return { bg: "bg-destructive/90", border: "border-destructive", ring: "ring-destructive/30", size: "w-14 h-14" };
    case "high": return { bg: "bg-destructive/60", border: "border-destructive/70", ring: "ring-destructive/20", size: "w-12 h-12" };
    case "medium": return { bg: "bg-yellow-500/70", border: "border-yellow-500", ring: "ring-yellow-500/20", size: "w-10 h-10" };
    default: return { bg: "bg-primary/50", border: "border-primary/60", ring: "ring-primary/20", size: "w-8 h-8" };
  }
}

export default function DemandHeatmap() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const totalGhost = ZONES.reduce((s, z) => s + z.ghostRequests, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold text-foreground">Ghost Request Heatmap</h2>
        </div>
        <span className="text-xs text-muted-foreground">{totalGhost} unmatched requests today</span>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0 relative h-72 bg-secondary">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {ZONES.map((zone, i) => {
            const style = getHeatStyle(zone.demand);
            const isSelected = selectedZone === zone.area;
            return (
              <motion.div
                key={zone.area}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
                className={`absolute ${zone.lat} flex flex-col items-center cursor-pointer`}
                onClick={() => setSelectedZone(isSelected ? null : zone.area)}
              >
                <div className={`${style.size} rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center ring-4 ${style.ring} transition-transform ${isSelected ? "scale-125" : "hover:scale-110"}`}>
                  <span className="text-[10px] font-bold text-primary-foreground">{zone.ghostRequests}</span>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground mt-0.5">{zone.area}</span>
              </motion.div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/50" />Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/70" />Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/60" />High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/90" />Critical</span>
          </div>
          <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <AlertTriangle className="w-3 h-3" /> Riders with no driver match
          </div>
        </CardContent>
      </Card>

      {/* Selected zone detail */}
      {selectedZone && (() => {
        const zone = ZONES.find(z => z.area === selectedZone)!;
        return (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{zone.area}</p>
                    <p className="text-xs text-muted-foreground">{zone.ghostRequests} ghost requests · {zone.demand} demand</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  zone.demand === "critical" ? "bg-destructive/15 text-destructive" :
                  zone.demand === "high" ? "bg-destructive/10 text-destructive" :
                  zone.demand === "medium" ? "bg-yellow-500/15 text-yellow-600" :
                  "bg-primary/10 text-primary"
                }`}>
                  {zone.demand.toUpperCase()}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}
    </div>
  );
}
