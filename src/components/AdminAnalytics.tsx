import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const heatmapZones = [
  { area: "Westlands", failRate: 42, lat: "top-[20%] left-[30%]" },
  { area: "Kilimani", failRate: 28, lat: "top-[45%] left-[50%]" },
  { area: "Eastleigh", failRate: 65, lat: "top-[30%] left-[70%]" },
  { area: "Karen", failRate: 15, lat: "top-[70%] left-[25%]" },
  { area: "CBD", failRate: 35, lat: "top-[50%] left-[45%]" },
  { area: "Langata", failRate: 22, lat: "top-[65%] left-[55%]" },
];

function getHeatColor(rate: number) {
  if (rate >= 50) return "bg-destructive/80 border-destructive";
  if (rate >= 30) return "bg-yellow-500/70 border-yellow-500";
  return "bg-primary/60 border-primary";
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at");

    if (error || !data) {
      toast({ title: "Export failed", variant: "destructive" });
      setExporting(false);
      return;
    }

    // Build CSV
    const header = "ID,Name,Phone,Created At\n";
    const rows = data.map((d) => `${d.id},${d.full_name ?? ""},${d.phone ?? ""},${d.created_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eride-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "Exported!", description: "CSV downloaded successfully." });
  };

  return (
    <div className="space-y-6">
      {/* Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Demand Heatmap</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" /> Low
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" /> Med
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" /> High
          </div>
        </div>
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-0 relative h-64 bg-secondary">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />
            {heatmapZones.map((zone, i) => (
              <motion.div
                key={zone.area}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`absolute ${zone.lat} flex flex-col items-center`}
              >
                <div className={`w-10 h-10 rounded-full ${getHeatColor(zone.failRate)} border-2 flex items-center justify-center opacity-80`}>
                  <span className="text-[10px] font-bold text-primary-foreground">{zone.failRate}%</span>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground mt-0.5">{zone.area}</span>
              </motion.div>
            ))}
            <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] text-muted-foreground">
              <AlertTriangle className="w-3 h-3" /> % of requests failing (no drivers)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground text-sm">User Export</p>
            <p className="text-xs text-muted-foreground">Download all registered users as CSV</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting} className="gap-2">
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
