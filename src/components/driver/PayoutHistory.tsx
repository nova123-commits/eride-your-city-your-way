import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';
import { useDriverEarnings, type PayoutRecord } from '@/hooks/useDriverEarnings';

interface PayoutHistoryProps {
  currency?: CurrencyCode;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-secondary' },
  processing: { icon: Loader2, label: 'Processing', className: 'text-primary bg-accent' },
  completed: { icon: CheckCircle2, label: 'Paid', className: 'text-primary bg-accent' },
  paid: { icon: CheckCircle2, label: 'Paid', className: 'text-primary bg-accent' },
};

const PayoutHistory: React.FC<PayoutHistoryProps> = ({ currency = 'KES' }) => {
  const { payouts, loading } = useDriverEarnings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">Payout History</h4>
      {payouts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No payouts yet</div>
      ) : (
        payouts.map((payout, i) => {
          const config = statusConfig[payout.status] ?? statusConfig.pending;
          const Icon = config.icon;
          return (
            <motion.div
              key={payout.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Driver Payout</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(payout.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  {payout.commission > 0 ? ` · Commission: KES ${payout.commission}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{formatCurrency(payout.net_amount, currency)}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.className}`}>
                  <Icon className={`w-2.5 h-2.5 ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                  {config.label}
                </span>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default PayoutHistory;
