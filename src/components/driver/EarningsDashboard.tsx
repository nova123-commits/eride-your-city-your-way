import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';

interface EarningsDashboardProps {
  currency?: CurrencyCode;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ currency = 'KES' }) => {
  const { summary, loading } = useDriverEarnings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Today's Earnings", value: summary.todayEarnings, icon: DollarSign, accent: true },
          { label: 'Weekly Total', value: summary.weeklyTotal, icon: TrendingUp, accent: false },
          { label: 'Trips This Week', value: summary.totalTrips, icon: Heart, accent: false, isCount: true },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-center ${
              item.accent ? 'brand-gradient text-primary-foreground' : 'bg-card border border-border'
            }`}
          >
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.accent ? '' : 'text-primary'}`} />
            <p className={`text-lg font-bold ${item.accent ? '' : 'text-foreground'}`}>
              {'isCount' in item && item.isCount ? item.value : formatCurrency(item.value, currency)}
            </p>
            <p className={`text-[9px] ${item.accent ? 'opacity-80' : 'text-muted-foreground'}`}>
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Last 7 Days</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.dailyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, currency), 'Earnings']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
