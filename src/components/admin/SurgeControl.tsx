import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Zap, MapPin, CloudRain, Calendar } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  multiplier: number;
  reason: string;
  active: boolean;
}

const INITIAL_ZONES: Zone[] = [
  { id: "z1", name: "Westlands", multiplier: 1.0, reason: "", active: false },
  { id: "z2", name: "CBD", multiplier: 1.0, reason: "", active: false },
  { id: "z3", name: "Kilimani", multiplier: 1.0, reason: "", active: false },
  { id: "z4", name: "Karen", multiplier: 1.0, reason: "", active: false },
  { id: "z5", name: "Eastleigh", multiplier: 1.0, reason: "", active: false },
  { id: "z6", name: "Langata", multiplier: 1.0, reason: "", active: false },
];

const REASONS = [
  { label: "Rain", icon: CloudRain },
  { label: "Event", icon: Calendar },
  { label: "Peak Hour", icon: Zap },
];

export default function SurgeControl() {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);

  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const applyAll = () => {
    const activeZones = zones.filter(z => z.active && z.multiplier > 1);
    if (activeZones.length === 0) {
      toast({ title: "No surges active", description: "Enable at least one zone with a multiplier > 1x.", variant: "destructive" });
      return;
    }
    toast({
      title: `Surge applied to ${activeZones.length} zone(s)`,
      description: activeZones.map(z => `${z.name}: ${z.multiplier}x`).join(", "),
    });
  };

  const clearAll = () => {
    setZones(INITIAL_ZONES);
    toast({ title: "All surges cleared" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-foreground">Surge Control</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {zones.filter(z => z.active).length} active
        </Badge>
      </div>

      <div className="space-y-3">
        {zones.map((zone, i) => (
          <motion.div key={zone.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className={`border-border/60 transition-all ${zone.active ? "ring-1 ring-yellow-500/40 border-yellow-500/40" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{zone.name}</span>
                  </div>
                  <button
                    onClick={() => updateZone(zone.id, { active: !zone.active, multiplier: zone.active ? 1.0 : 1.2 })}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                      zone.active ? "bg-yellow-500/15 text-yellow-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {zone.active ? "Active" : "Off"}
                  </button>
                </div>

                {zone.active && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Multiplier</span>
                        <span className="text-sm font-bold text-yellow-600">{zone.multiplier}x</span>
                      </div>
                      <Slider
                        value={[zone.multiplier * 10]}
                        onValueChange={([v]) => updateZone(zone.id, { multiplier: Math.round(v) / 10 })}
                        min={10}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>1.0x</span><span>2.0x</span><span>3.0x</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {REASONS.map(r => (
                        <button
                          key={r.label}
                          onClick={() => updateZone(zone.id, { reason: zone.reason === r.label ? "" : r.label })}
                          className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
                            zone.reason === r.label
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-muted border-border text-muted-foreground"
                          }`}
                        >
                          <r.icon className="w-3 h-3" /> {r.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={clearAll}>Clear All</Button>
        <Button className="flex-1 gap-2" onClick={applyAll}>
          <Zap className="w-4 h-4" /> Apply Surges
        </Button>
      </div>
    </div>
  );
}
