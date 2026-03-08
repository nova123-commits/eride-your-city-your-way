import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Clock, CheckCircle2, XCircle, Send } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateTicket = async (ticketId: string, status: string, adminResponse?: string) => {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (adminResponse) update.admin_response = adminResponse;

    const { error } = await supabase.from("support_tickets").update(update).eq("id", ticketId);
    if (error) {
      toast({ title: "Error", description: "Could not update ticket.", variant: "destructive" });
    } else {
      toast({ title: "Ticket updated" });
      setSelectedTicket(null);
      setResponse("");
      fetchTickets();
    }
  };

  const statusColor = (s: string) => {
    if (s === "open") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (s === "resolved") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground";
  };

  const statusIcon = (s: string) => {
    if (s === "open") return <Clock className="w-3 h-3" />;
    if (s === "resolved") return <CheckCircle2 className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Support Tickets</h2>
        <Badge variant="outline">{tickets.filter((t) => t.status === "open").length} open</Badge>
      </div>

      {selectedTicket ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>← Back</Button>
              </div>
              <div className="flex gap-2 mt-1">
                <Badge className={statusColor(selectedTicket.status)}>{statusIcon(selectedTicket.status)} {selectedTicket.status}</Badge>
                <Badge variant="outline">{selectedTicket.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-auto">
                {selectedTicket.description}
              </div>
              <p className="text-[10px] text-muted-foreground">{new Date(selectedTicket.created_at).toLocaleString()}</p>

              {selectedTicket.admin_response && (
                <div className="bg-accent/30 rounded-lg p-3 text-sm text-foreground">
                  <p className="text-xs font-medium text-primary mb-1">Admin Response:</p>
                  {selectedTicket.admin_response}
                </div>
              )}

              <Textarea
                placeholder="Write a response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateTicket(selectedTicket.id, "resolved", response || undefined)}
                  disabled={!response.trim()}
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Respond & Resolve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTicket(selectedTicket.id, "closed")}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No support tickets yet.</p>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(ticket.status)}`}>{ticket.status}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
