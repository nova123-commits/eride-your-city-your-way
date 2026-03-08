import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownRight, ArrowUpRight, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  label: string;
  date: string;
}

interface DriverWalletProps {
  balance: number;
  currency: CurrencyCode;
  transactions: WalletTransaction[];
  onWithdraw: (amount: number) => void;
}

const DriverWallet: React.FC<DriverWalletProps> = ({ balance, currency, transactions, onWithdraw }) => {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);
  const canWithdraw = balance >= 500;

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawDone(true);
      onWithdraw(balance);
      setTimeout(() => setWithdrawDone(false), 2000);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl brand-gradient p-5 text-primary-foreground"
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Driver Wallet</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(balance, currency)}</p>
        <p className="text-xs opacity-75 mt-1">Available balance</p>
      </motion.div>

      {/* Fare split info */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Your Earnings', pct: '83.5%', color: 'text-primary' },
          { label: 'Platform Fee', pct: '15%', color: 'text-muted-foreground' },
          { label: 'Housing Levy', pct: '1.5%', color: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.pct}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Withdraw button */}
      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw || withdrawing}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-press transition-colors ${
          canWithdraw
            ? 'brand-gradient text-primary-foreground'
            : 'bg-secondary text-muted-foreground cursor-not-allowed'
        }`}
      >
        {withdrawing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending to M-Pesa...
          </>
        ) : withdrawDone ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Withdrawal Sent!
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4" />
            Withdraw to M-Pesa
          </>
        )}
      </button>
      {!canWithdraw && !withdrawing && (
        <p className="text-xs text-center text-muted-foreground">Minimum withdrawal: KES 500</p>
      )}

      {/* Transaction history */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Recent Transactions</h4>
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tx.type === 'credit' ? 'bg-primary/10' : 'bg-destructive/10'
            }`}>
              {tx.type === 'credit' ? (
                <ArrowDownRight className="w-4 h-4 text-primary" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{tx.label}</p>
              <p className="text-[10px] text-muted-foreground">{tx.date}</p>
            </div>
            <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-primary' : 'text-destructive'}`}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverWallet;
