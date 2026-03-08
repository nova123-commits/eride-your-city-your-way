import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERideLogo from '@/components/ERideLogo';
import DriverWallet from '@/components/payments/DriverWallet';
import CurrencyToggle from '@/components/payments/CurrencyToggle';
import { type CurrencyCode } from '@/lib/currency';

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'credit' as const, amount: 680, label: 'Trip #4821 — Westlands → JKIA', date: 'Today, 2:15 PM' },
  { id: '2', type: 'credit' as const, amount: 420, label: 'Trip #4820 — CBD → Kilimani', date: 'Today, 11:30 AM' },
  { id: '3', type: 'debit' as const, amount: 3500, label: 'M-Pesa Withdrawal', date: 'Yesterday, 6:00 PM' },
  { id: '4', type: 'credit' as const, amount: 550, label: 'Trip #4819 — Karen → Langata', date: 'Yesterday, 3:45 PM' },
  { id: '5', type: 'credit' as const, amount: 890, label: 'Trip #4818 — Upperhill → Eastleigh', date: 'Yesterday, 1:20 PM' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<CurrencyCode>('KES');
  const [balance, setBalance] = useState(4250);

  const handleWithdraw = (amount: number) => {
    setBalance(0);
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center btn-press">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <ERideLogo size="sm" />
          <div className="w-28">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <DriverWallet
          balance={balance}
          currency={currency}
          transactions={MOCK_TRANSACTIONS}
          onWithdraw={handleWithdraw}
        />
      </div>
    </div>
  );
}
