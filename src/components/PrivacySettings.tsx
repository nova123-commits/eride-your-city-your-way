import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PrivacySettings() {
  const { toast } = useToast();
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  const handleDownloadData = () => {
    toast({
      title: "Data request submitted",
      description: "We'll email you a copy of your data within 48 hours as required by the Kenya Data Protection Act.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Label htmlFor="marketing" className="text-sm font-semibold text-foreground">Marketing Communications</Label>
            <p className="text-xs text-muted-foreground">Receive offers and promotions</p>
          </div>
        </div>
        <Switch
          id="marketing"
          checked={marketingEnabled}
          onCheckedChange={setMarketingEnabled}
        />
      </div>

      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-4 rounded-2xl"
        onClick={handleDownloadData}
      >
        <Download className="w-4 h-4 text-primary" />
        <div className="text-left">
          <p className="text-sm font-semibold">Download My Data</p>
          <p className="text-xs text-muted-foreground">Kenya Data Protection Act compliance</p>
        </div>
      </Button>
    </div>
  );
}
