import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, ArrowDownRight, ArrowUpRight, Smartphone, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ERideLogo from '@/components/ERideLogo';
import RoleNav from '@/components/RoleNav';

/* ─── Validation schemas ─────────────────────────────────────── */
const depositSchema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(10, 'Minimum deposit is KES 10').max(150000, 'Maximum deposit is KES 150,000'),
  phone: z.string().regex(/^(\+?254|0)7\d{8}$/, 'Enter a valid M-Pesa number e.g. 0712345678'),
});

const withdrawSchema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(500, 'Minimum withdrawal is KES 500'),
  phone: z.string().regex(/^(\+?254|0)7\d{8}$/, 'Enter a valid M-Pesa number e.g. 0712345678'),
});

const TRANSACTION_FEE = 15;

type TxType = 'deposit' | 'withdrawal' | 'ride_payment' | 'ride_earning';

interface Tx {
  id: string;
  type: TxType;
  amount: number;
  fee: number;
  label: string;
  phone: string | null;
  status: string;
  created_at: string;
}

type ModalMode = 'deposit' | 'withdraw' | null;
type DepositStage = 'form' | 'stk_push' | 'success';

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium' }) + ', ' +
    new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function txLabel(type: TxType) {
  switch (type) {
    case 'deposit': return 'M-Pesa Deposit';
    case 'withdrawal': return 'M-Pesa Withdrawal';
    case 'ride_payment': return 'Ride Payment';
    case 'ride_earning': return 'Ride Earning';
  }
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const [modal, setModal] = useState<ModalMode>(null);
  const [depositStage, setDepositStage] = useState<DepositStage>('form');

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; phone?: string }>({});

  /* ── Fetch balance + realtime ───────────────────────────────── */
  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      // Ensure wallet row exists (upsert)
      await supabase.from('wallets').upsert({ user_id: user.id, balance: 0 }, { onConflict: 'user_id', ignoreDuplicates: true });

      const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
      if (data) setBalance(Number(data.balance));
      setLoadingBalance(false);
    };
    fetchWallet();

    const channel = supabase.channel('wallet-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        (payload: any) => { if (payload.new?.balance !== undefined) setBalance(Number(payload.new.balance)); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  /* ── Fetch transactions ─────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const fetchTx = async () => {
      const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      setTransactions((data as Tx[]) ?? []);
    };
    fetchTx();

    const ch = supabase.channel('wallet-tx')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` },
        (payload: any) => { setTransactions(prev => [payload.new as Tx, ...prev]); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  /* ── Reset modal state ──────────────────────────────────────── */
  const openModal = (mode: ModalMode) => {
    setAmount(''); setPhone(''); setErrors({}); setDepositStage('form');
    setModal(mode);
  };

  /* ── Deposit flow ───────────────────────────────────────────── */
  const handleDeposit = async () => {
    const parsed = depositSchema.safeParse({ amount: Number(amount), phone });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ amount: fieldErrors.amount?.[0], phone: fieldErrors.phone?.[0] });
      return;
    }
    setErrors({});
    setDepositStage('stk_push');

    // Simulate STK push — 5 second wait
    await new Promise(r => setTimeout(r, 5000));

    if (!user) return;
    const newBalance = balance + parsed.data.amount;

    const { error: walletErr } = await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    const { error: txErr } = await supabase.from('wallet_transactions').insert({ user_id: user.id, type: 'deposit', amount: parsed.data.amount, fee: 0, label: 'M-Pesa Deposit', phone: parsed.data.phone, status: 'completed' });

    if (walletErr || txErr) {
      toast({ title: 'Transaction failed', description: walletErr?.message ?? txErr?.message, variant: 'destructive' });
      setDepositStage('form');
      return;
    }

    setDepositStage('success');
    toast({ title: '✅ Deposit Successful!', description: `KES ${parsed.data.amount.toLocaleString()} added to your wallet.` });
    setTimeout(() => setModal(null), 1800);
  };

  /* ── Withdrawal flow ────────────────────────────────────────── */
  const handleWithdraw = async () => {
    const parsed = withdrawSchema.safeParse({ amount: Number(amount), phone });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ amount: fieldErrors.amount?.[0], phone: fieldErrors.phone?.[0] });
      return;
    }
    if (parsed.data.amount + TRANSACTION_FEE > balance) {
      setErrors({ amount: `Insufficient balance. Available: KES ${balance.toFixed(2)}` });
      return;
    }
    setErrors({});
    setDepositStage('stk_push');

    await new Promise(r => setTimeout(r, 4000));

    if (!user) return;
    const total = parsed.data.amount + TRANSACTION_FEE;
    const newBalance = balance - total;

    const { error: walletErr } = await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    const { error: txErr } = await supabase.from('wallet_transactions').insert({ user_id: user.id, type: 'withdrawal', amount: parsed.data.amount, fee: TRANSACTION_FEE, label: 'M-Pesa Withdrawal', phone: parsed.data.phone, status: 'completed' });

    if (walletErr || txErr) {
      toast({ title: 'Withdrawal failed', description: walletErr?.message ?? txErr?.message, variant: 'destructive' });
      setDepositStage('form');
      return;
    }

    setDepositStage('success');
    toast({ title: '✅ Withdrawal Sent!', description: `KES ${parsed.data.amount.toLocaleString()} sent to ${parsed.data.phone}.` });
    setTimeout(() => setModal(null), 1800);
  };

  const canWithdraw = balance > 500;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <ERideLogo size="sm" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 max-w-md mx-auto w-full">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl brand-gradient p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">eRide Wallet</span>
          </div>
          {loadingBalance ? (
            <div className="h-10 flex items-center"><Loader2 className="w-6 h-6 animate-spin opacity-70" /></div>
          ) : (
            <p className="text-4xl font-bold tracking-tight">KES {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
          )}
          <p className="text-xs opacity-75 mt-1">Available balance</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openModal('deposit')}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-accent/30 transition-all btn-press"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Deposit</span>
            <span className="text-[10px] text-muted-foreground">Via M-Pesa</span>
          </button>

          <button
            onClick={() => openModal('withdraw')}
            disabled={role === 'rider' ? false : !canWithdraw}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all btn-press ${
              role !== 'rider' && !canWithdraw
                ? 'bg-secondary border-border opacity-50 cursor-not-allowed'
                : 'bg-card border-border hover:border-primary/40 hover:bg-accent/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-sm font-semibold text-foreground">Withdraw</span>
            <span className="text-[10px] text-muted-foreground">{role === 'driver' && !canWithdraw ? 'Min KES 500' : 'Via M-Pesa'}</span>
          </button>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'deposit' || tx.type === 'ride_earning';
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                      {isCredit
                        ? <ArrowDownRight className="w-4 h-4 text-primary" />
                        : <ArrowUpRight className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{tx.label || txLabel(tx.type)}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(tx.created_at)}{tx.fee > 0 ? ` · Fee: KES ${tx.fee}` : ''}</p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-primary' : 'text-destructive'}`}>
                      {isCredit ? '+' : '-'}KES {tx.amount.toLocaleString()}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && depositStage === 'form') setModal(null); }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-background rounded-2xl p-6 shadow-2xl space-y-4 relative">

              {/* Close */}
              {depositStage === 'form' && (
                <button onClick={() => setModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              {/* STK Push / Success state */}
              {depositStage === 'stk_push' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Check your phone</p>
                    <p className="text-sm text-muted-foreground mt-1">Enter your M-Pesa PIN to {modal === 'deposit' ? 'complete deposit' : 'confirm withdrawal'}...</p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: modal === 'deposit' ? 5 : 4, ease: 'linear' }} />
                  </div>
                </div>
              )}

              {depositStage === 'success' && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">{modal === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Sent!'}</p>
                </div>
              )}

              {depositStage === 'form' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {modal === 'deposit' ? 'Deposit via M-Pesa' : 'Withdraw to M-Pesa'}
                    </h2>
                    {modal === 'withdraw' && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> A transaction fee of KES {TRANSACTION_FEE} applies
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Amount (KES)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">KES</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm bg-background text-foreground outline-none transition-colors ${errors.amount ? 'border-destructive' : 'border-border focus:border-primary'}`}
                      />
                    </div>
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className={`w-full px-4 py-3 rounded-xl border text-sm bg-background text-foreground outline-none transition-colors ${errors.phone ? 'border-destructive' : 'border-border focus:border-primary'}`}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  {/* Summary for withdrawal */}
                  {modal === 'withdraw' && amount && !errors.amount && (
                    <div className="p-3 rounded-xl bg-accent/40 text-xs space-y-1">
                      <div className="flex justify-between text-foreground">
                        <span>Amount</span><span>KES {Number(amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Transaction Fee</span><span>KES {TRANSACTION_FEE}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
                        <span>Total Deducted</span><span>KES {(Number(amount) + TRANSACTION_FEE).toLocaleString()}</span>
                      </div>
                      {phone && <p className="text-muted-foreground">Sending to: <span className="font-medium text-foreground">{phone}</span></p>}
                    </div>
                  )}

                  <button
                    onClick={modal === 'deposit' ? handleDeposit : handleWithdraw}
                    className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 btn-press"
                  >
                    <Smartphone className="w-4 h-4" />
                    {modal === 'deposit' ? 'Send STK Push' : 'Confirm Withdrawal'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoleNav />
    </div>
  );
}
