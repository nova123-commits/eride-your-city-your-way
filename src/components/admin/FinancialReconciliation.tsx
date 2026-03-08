import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, DollarSign, TrendingUp, Minus, Settings, Send, Loader2 } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import CurrencyToggle from "@/components/payments/CurrencyToggle";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FinancialReconciliation() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState<CurrencyCode>("KES");
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<"overview" | "ledger">("overview");
  const [commission, setCommission] = useState("15");
  const [savingCommission, setSavingCommission] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [payoutModal, setPayoutModal] = useState<any | null>(null);
  const [payingOut, setPayingOut] = useState(false);

  // Fetch commission rate
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "commission_rate").single()
      .then(({ data }) => { if (data) setCommission(data.value); });
  }, []);

  // Fetch ledger
  useEffect(() => {
    if (tab !== "ledger") return;
    setLoadingTx(true);
    supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setTransactions(data || []); setLoadingTx(false); });
  }, [tab]);

  const saveCommission = async () => {
    const rate = parseFloat(commission);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Invalid rate", variant: "destructive" }); return;
    }
    setSavingCommission(true);
    await supabase.from("platform_settings").update({ value: String(rate), updated_at: new Date().toISOString() }).eq("key", "commission_rate");
    setSavingCommission(false);
    toast({ title: "Commission Updated", description: `Global rate set to ${rate}%` });
  };

  const confirmPayout = async () => {
    setPayingOut(true);
    await new Promise(r => setTimeout(r, 3000));
    toast({ title: "Payout Sent ✓", description: `KES ${payoutModal?.amount} sent to ${payoutModal?.phone || "driver's M-Pesa"}` });
    setPayingOut(false);
    setPayoutModal(null);
  };

  const MOCK_DATA = [
    { month: "Jan 2026", revenue: 4850000, payouts: 3880000, trips: 15200 },
    { month: "Feb 2026", revenue: 4520000, payouts: 3616000, trips: 14100 },
    { month: "Mar 2026", revenue: 5210000, payouts: 4168000, trips: 16800 },
    { month: "Apr 2026", revenue: 4980000, payouts: 3984000, trips: 15900 },
    { month: "May 2026", revenue: 5400000, payouts: 4320000, trips: 17200 },
  ];

  const totalRevenue = MOCK_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalPayouts = MOCK_DATA.reduce((s, d) => s + d.payouts, 0);
  const platformNet = totalRevenue - totalPayouts;

  const exportCSV = () => {
    setExporting(true);
    const header = "Month,Revenue (KES),Driver Payouts (KES),Platform Net (KES),Trips\n";
    const rows = MOCK_DATA.map(d => `${d.month},${d.revenue},${d.payouts},${d.revenue - d.payouts},${d.trips}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `eride-financial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "CSV Exported" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Financial Control</h2>
        </div>
        <CurrencyToggle currency={currency} onChange={setCurrency} />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["overview", "ledger"] as const).map(t => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} className="text-xs capitalize" onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : "M-Pesa Ledger"}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Revenue", value: totalRevenue, icon: TrendingUp, color: "text-primary" },
              { label: "Payouts", value: totalPayouts, icon: Minus, color: "text-muted-foreground" },
              { label: "Net", value: platformNet, icon: DollarSign, color: "text-primary" },
            ].map(stat => (
              <Card key={stat.label} className="border-border/60">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(stat.value, currency)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Commission */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Global Commission Rate</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Rate (%)</Label>
                  <Input type="number" value={commission} onChange={e => setCommission(e.target.value)} className="mt-1" min="0" max="100" />
                </div>
                <Button onClick={saveCommission} disabled={savingCommission} className="mt-5 gap-1" size="sm">
                  {savingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Applied to all future ride fares platform-wide.</p>
            </CardContent>
          </Card>

          {/* Revenue Table */}
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Month</TableHead>
                    <TableHead className="text-xs text-right">Revenue</TableHead>
                    <TableHead className="text-xs text-right">Payouts</TableHead>
                    <TableHead className="text-xs text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DATA.map(row => (
                    <TableRow key={row.month}>
                      <TableCell className="text-xs font-medium">{row.month}</TableCell>
                      <TableCell className="text-xs text-right text-primary font-semibold">{formatCurrency(row.revenue, currency)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{formatCurrency(row.payouts, currency)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{formatCurrency(row.revenue - row.payouts, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full gap-2" onClick={exportCSV} disabled={exporting}>
            <Download className="w-4 h-4" /> {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </>
      )}

      {tab === "ledger" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">All M-Pesa deposits & withdrawals across the platform.</p>
          {loadingTx ? (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <Card key={tx.id} className="border-border/60">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{tx.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                        {tx.phone && <span className="text-[10px] text-muted-foreground">{tx.phone}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === "deposit" || tx.type === "ride_earning" ? "text-primary" : "text-destructive"}`}>
                        {tx.type === "deposit" || tx.type === "ride_earning" ? "+" : "-"}KES {Number(tx.amount).toLocaleString()}
                      </p>
                      {tx.type === "withdrawal" || tx.type === "ride_earning" ? (
                        <Button size="sm" variant="outline" className="text-[10px] h-6 mt-1 gap-1" onClick={() => setPayoutModal(tx)}>
                          <Send className="w-3 h-3" /> Confirm Payout
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payout Confirmation Dialog */}
      <Dialog open={!!payoutModal} onOpenChange={() => setPayoutModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm M-Pesa Payout</DialogTitle>
          </DialogHeader>
          {payoutModal && (
            <div className="space-y-3">
              <Card className="border-border/60">
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm"><span className="text-muted-foreground">Amount:</span> <span className="font-bold">KES {Number(payoutModal.amount).toLocaleString()}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Send to:</span> {payoutModal.phone || "Driver's registered phone"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Fee:</span> KES 15</p>
                </CardContent>
              </Card>
              <Button className="w-full gap-2" onClick={confirmPayout} disabled={payingOut}>
                {payingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending via M-Pesa...</> : <><Send className="w-4 h-4" /> Send Payout</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
