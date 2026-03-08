import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';

interface Payout {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'processing' | 'paid';
  phone: string;
}

interface PayoutHistoryProps {
  currency?: CurrencyCode;
}

const MOCK_PAYOUTS: Payout[] = [
  { id: '1', amount: 8500, date: 'Mar 7, 2026', status: 'paid', phone: '0712***890' },
  { id: '2', amount: 6200, date: 'Mar 5, 2026', status: 'paid', phone: '0712***890' },
  { id: '3', amount: 3500, date: 'Mar 8, 2026', status: 'processing', phone: '0712***890' },
  { id: '4', amount: 4100, date: 'Mar 3, 2026', status: 'paid', phone: '0712***890' },
];

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-secondary' },
  processing: { icon: Loader2, label: 'Processing', className: 'text-primary bg-accent' },
  paid: { icon: CheckCircle2, label: 'Paid', className: 'text-primary bg-accent' },
};

const PayoutHistory: React.FC<PayoutHistoryProps> = ({ currency = 'KES' }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">Payout History</h4>
      {MOCK_PAYOUTS.map((payout, i) => {
        const config = statusConfig[payout.status];
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
              <p className="text-sm font-medium text-foreground">M-Pesa → {payout.phone}</p>
              <p className="text-[10px] text-muted-foreground">{payout.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">{formatCurrency(payout.amount, currency)}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.className}`}>
                <Icon className={`w-2.5 h-2.5 ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                {config.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PayoutHistory;
