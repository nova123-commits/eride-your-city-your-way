import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ERideLogo from '@/components/ERideLogo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, FileText, TrendingUp, DollarSign, Calculator, Download } from 'lucide-react';
import { TAX_RATES, formatCurrency, type CurrencyCode } from '@/lib/currency';
import CurrencyToggle from '@/components/payments/CurrencyToggle';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyTax {
  month: string;
  grossTurnover: number;
  trips: number;
}

export default function TaxReport() {
  const [currency, setCurrency] = useState<CurrencyCode>('KES');
  const [monthlyData, setMonthlyData] = useState<MonthlyTax[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: rides } = await supabase
        .from("rides")
        .select("final_fare, completed_at")
        .eq("status", "ride_completed")
        .gte("completed_at", sixMonthsAgo.toISOString());

      const monthMap: Record<string, { grossTurnover: number; trips: number }> = {};

      (rides || []).forEach(r => {
        if (!r.completed_at) return;
        const d = new Date(r.completed_at);
        const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
        if (!monthMap[key]) monthMap[key] = { grossTurnover: 0, trips: 0 };
        monthMap[key].grossTurnover += Number(r.final_fare) || 0;
        monthMap[key].trips += 1;
      });

      setMonthlyData(Object.entries(monthMap).map(([month, data]) => ({ month, ...data })));
      setLoading(false);
    };

    fetchData();
  }, []);

  const totalGross = monthlyData.reduce((s, m) => s + m.grossTurnover, 0);
  const totalTrips = monthlyData.reduce((s, m) => s + m.trips, 0);
  const septTax = Math.round(totalGross * TAX_RATES.SEPT);
  const vatCollected = Math.round(totalGross * TAX_RATES.VAT);
  const housingLevy = Math.round(totalGross * TAX_RATES.HOUSING_LEVY);

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
            <Calculator className="w-3 h-3 mr-1" /> Tax Report
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KRA Tax Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Automated compliance — real-time data</p>
          </div>
          <div className="w-32">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : monthlyData.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No completed rides yet. Tax data will appear here once rides are completed.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Gross Turnover', value: totalGross, icon: TrendingUp, color: 'text-primary' },
                { label: 'Total Trips', value: totalTrips, icon: FileText, color: 'text-foreground', isCurrency: false },
                { label: 'SEPT (3%)', value: septTax, icon: DollarSign, color: 'text-destructive' },
                { label: 'VAT Collected', value: vatCollected, icon: Calculator, color: 'text-primary' },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/60">
                  <CardContent className="p-4">
                    <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>
                      {stat.isCurrency === false ? stat.value.toLocaleString() : formatCurrency(stat.value, currency)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Housing Levy */}
            <Card className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Housing Levy (1.5%)</p>
                  <p className="text-xs text-muted-foreground">Self-employed requirement</p>
                </div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(housingLevy, currency)}</p>
              </CardContent>
            </Card>

            {/* Monthly breakdown */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Monthly Breakdown</h2>
              {monthlyData.map((m) => {
                const mSept = Math.round(m.grossTurnover * TAX_RATES.SEPT);
                const mVat = Math.round(m.grossTurnover * TAX_RATES.VAT);
                return (
                  <motion.div key={m.month} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">{m.month}</p>
                          <p className="text-sm font-bold text-primary">{formatCurrency(m.grossTurnover, currency)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-secondary">
                            <p className="text-[10px] text-muted-foreground">Trips</p>
                            <p className="text-sm font-bold text-foreground">{m.trips.toLocaleString()}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary">
                            <p className="text-[10px] text-muted-foreground">SEPT</p>
                            <p className="text-sm font-bold text-destructive">{formatCurrency(mSept, currency)}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary">
                            <p className="text-[10px] text-muted-foreground">VAT</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(mVat, currency)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Download report */}
            <button className="w-full py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 btn-press">
              <Download className="w-4 h-4" />
              Download KRA Report (PDF)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
