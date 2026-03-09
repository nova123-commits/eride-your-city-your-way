import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Send, Loader2, Users, Car, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TARGETS = [
  { value: "rider", label: "All Riders", icon: Users },
  { value: "driver", label: "All Drivers", icon: Car },
  { value: "all", label: "Everyone", icon: Globe },
] as const;

const TEMPLATES = [
  { title: "Rainy Day Bonus", message: "🌧️ Rainy day in Kisii! 1.2x earnings for drivers today.", target: "driver" },
  { title: "Weekend Promo", message: "🎉 This weekend: 20% off your first 3 rides! Use code WEEKEND20.", target: "rider" },
  { title: "Maintenance Notice", message: "⚙️ Scheduled maintenance tonight 2-4 AM. Brief service interruption expected.", target: "all" },
];

export default function BroadcastComposer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"rider" | "driver" | "all">("all");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);

  const loadHistory = async () => {
    if (loadedHistory) return;
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(20);
    setHistory(data || []);
    setLoadedHistory(true);
  };

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" }); return;
    }
    setSending(true);
    const { error } = await supabase.from("broadcasts").insert({
      sender_id: user!.id,
      target_role: target,
      title: title.trim(),
      message: message.trim(),
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      const targetLabel = TARGETS.find(t => t.value === target)?.label;
      toast({ title: "Broadcast Sent ✓", description: `Notification sent to ${targetLabel}` });
      setTitle(""); setMessage("");
      setLoadedHistory(false);
    }
    setSending(false);
  };

  const useTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title);
    setMessage(t.message);
    setTarget(t.target as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">System Broadcast</h2>
      </div>

      {/* Quick Templates */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick templates:</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <Badge key={t.title} variant="outline" className="cursor-pointer hover:bg-muted text-xs" onClick={() => useTemplate(t)}>
              {t.title}
            </Badge>
          ))}
        </div>
      </div>

      {/* Composer */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-4">
          {/* Target */}
          <div>
            <Label className="text-xs">Send to</Label>
            <div className="flex gap-2 mt-1.5">
              {TARGETS.map(t => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={target === t.value ? "default" : "outline"}
                  className="text-xs gap-1 flex-1"
                  onClick={() => setTarget(t.value)}
                >
                  <t.icon className="w-3 h-3" /> {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..." className="mt-1" maxLength={100} />
          </div>

          <div>
            <Label className="text-xs">Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your broadcast message..." className="mt-1" rows={3} maxLength={500} />
            <p className="text-[10px] text-muted-foreground mt-1">{message.length}/500</p>
          </div>

          <Button className="w-full gap-2" onClick={sendBroadcast} disabled={sending || !title.trim() || !message.trim()}>
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Broadcast</>}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={loadHistory}>
          {loadedHistory ? "Recent Broadcasts" : "Load broadcast history →"}
        </Button>
        {loadedHistory && (
          <div className="space-y-2 mt-2">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No broadcasts sent yet.</p>
            ) : history.map(b => (
              <Card key={b.id} className="border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{b.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{b.target_role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(b.created_at).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
