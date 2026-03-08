import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, DollarSign, TrendingUp, Minus } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import CurrencyToggle from "@/components/payments/CurrencyToggle";

const MOCK_DATA = [
  { month: "Jan 2026", revenue: 4850000, payouts: 3880000, trips: 15200 },
  { month: "Feb 2026", revenue: 4520000, payouts: 3616000, trips: 14100 },
  { month: "Mar 2026", revenue: 5210000, payouts: 4168000, trips: 16800 },
  { month: "Apr 2026", revenue: 4980000, payouts: 3984000, trips: 15900 },
  { month: "May 2026", revenue: 5400000, payouts: 4320000, trips: 17200 },
];

export default function FinancialReconciliation() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState<CurrencyCode>("KES");
  const [exporting, setExporting] = useState(false);

  const totalRevenue = MOCK_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalPayouts = MOCK_DATA.reduce((s, d) => s + d.payouts, 0);
  const platformNet = totalRevenue - totalPayouts;
  const totalTrips = MOCK_DATA.reduce((s, d) => s + d.trips, 0);

  const exportCSV = () => {
    setExporting(true);
    const header = "Month,Revenue (KES),Driver Payouts (KES),Platform Net (KES),Trips\n";
    const rows = MOCK_DATA.map(d => `${d.month},${d.revenue},${d.payouts},${d.revenue - d.payouts},${d.trips}`).join("\n");
    const totals = `\nTOTAL,${totalRevenue},${totalPayouts},${platformNet},${totalTrips}`;
    const blob = new Blob([header + rows + totals], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eride-financial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "CSV Exported", description: "Financial report downloaded for KRA filing." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Financial Reconciliation</h2>
        </div>
        <div className="w-28">
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Platform Revenue", value: totalRevenue, icon: TrendingUp, color: "text-primary" },
          { label: "Driver Payouts", value: totalPayouts, icon: Minus, color: "text-muted-foreground" },
          { label: "Platform Net", value: platformNet, icon: DollarSign, color: "text-primary" },
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

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-xs text-right">Revenue</TableHead>
                <TableHead className="text-xs text-right">Payouts</TableHead>
                <TableHead className="text-xs text-right">Net</TableHead>
                <TableHead className="text-xs text-right">Trips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map(row => (
                <TableRow key={row.month}>
                  <TableCell className="text-xs font-medium">{row.month}</TableCell>
                  <TableCell className="text-xs text-right text-primary font-semibold">{formatCurrency(row.revenue, currency)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{formatCurrency(row.payouts, currency)}</TableCell>
                  <TableCell className="text-xs text-right font-semibold">{formatCurrency(row.revenue - row.payouts, currency)}</TableCell>
                  <TableCell className="text-xs text-right">{row.trips.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell className="text-xs">TOTAL</TableCell>
                <TableCell className="text-xs text-right text-primary">{formatCurrency(totalRevenue, currency)}</TableCell>
                <TableCell className="text-xs text-right">{formatCurrency(totalPayouts, currency)}</TableCell>
                <TableCell className="text-xs text-right">{formatCurrency(platformNet, currency)}</TableCell>
                <TableCell className="text-xs text-right">{totalTrips.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2" onClick={exportCSV} disabled={exporting}>
        <Download className="w-4 h-4" />
        {exporting ? "Exporting..." : "Export for KRA Filing (CSV)"}
      </Button>
    </div>
  );
}
