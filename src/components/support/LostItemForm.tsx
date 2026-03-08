import { useState } from "react";
import { ArrowLeft, Package, Send } from "lucide-react";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LostItemFormProps {
  onBack: () => void;
}

export default function LostItemForm({ onBack }: LostItemFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("lost_items").insert({
      reporter_id: user.id,
      description: description.trim(),
      trip_date: tripDate || null,
    });

    if (error) {
      toast({ title: "Error", description: "Could not submit report. Try again.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Report submitted!", description: "We'll notify the driver and our team will follow up." });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Report Submitted</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Our team has been notified and will work with the driver to locate your item.
        </p>
        <Button onClick={onBack}>Back to Help Center</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Report Lost Item</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tripDate">Approximate Trip Date</Label>
                <Input
                  id="tripDate"
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Describe your lost item *</Label>
                <Textarea
                  id="description"
                  placeholder="E.g. Black leather wallet left on the back seat..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !description.trim()}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
