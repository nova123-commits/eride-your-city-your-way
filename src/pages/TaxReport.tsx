import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ERideLogo from '@/components/ERideLogo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield, FileText, TrendingUp, DollarSign, Calculator, Download
} from 'lucide-react';
import { TAX_RATES, formatCurrency, type CurrencyCode } from '@/lib/currency';
import CurrencyToggle from '@/components/payments/CurrencyToggle';

// Mock data for tax reports
const MOCK_MONTHLY = [
  { month: 'Jan 2026', grossTurnover: 1250000, trips: 4200 },
  { month: 'Feb 2026', grossTurnover: 1180000, trips: 3900 },
  { month: 'Mar 2026', grossTurnover: 1340000, trips: 4500 },
];

export default function TaxReport() {
  const [currency, setCurrency] = useState<CurrencyCode>('KES');

  const totalGross = MOCK_MONTHLY.reduce((s, m) => s + m.grossTurnover, 0);
  const totalTrips = MOCK_MONTHLY.reduce((s, m) => s + m.trips, 0);
  const septTax = Math.round(totalGross * TAX_RATES.SEPT);
  const vatCollected = Math.round(totalGross * TAX_RATES.VAT);
  const housingLevy = Math.round(totalGross * TAX_RATES.HOUSING_LEVY);

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-[hsl(210,60%,70%)] text-[hsl(210,80%,50%)]">
            <Calculator className="w-3 h-3 mr-1" /> Tax Report
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KRA Tax Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Q1 2026 — Automated compliance</p>
          </div>
          <div className="w-32">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Gross Turnover', value: totalGross, icon: TrendingUp, color: 'text-primary' },
            { label: 'Total Trips', value: totalTrips, icon: FileText, color: 'text-foreground', isCurrency: false },
            { label: 'SEPT (3%)', value: septTax, icon: DollarSign, color: 'text-destructive' },
            { label: 'VAT Collected', value: vatCollected, icon: Calculator, color: 'text-[hsl(210,80%,50%)]' },
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
              <p className="text-xs text-muted-foreground">2026 Self-employed requirement</p>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(housingLevy, currency)}</p>
          </CardContent>
        </Card>

        {/* Monthly breakdown */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Monthly Breakdown</h2>
          {MOCK_MONTHLY.map((m) => {
            const mSept = Math.round(m.grossTurnover * TAX_RATES.SEPT);
            const mVat = Math.round(m.grossTurnover * TAX_RATES.VAT);
            return (
              <motion.div
                key={m.month}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
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
      </div>
    </div>
  );
}
