import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CreditCard, Wallet, CheckCircle2, Loader2, X } from 'lucide-react';

export type PaymentMethod = 'mpesa' | 'card' | 'wallet';

interface PaymentFlowProps {
  amount: number;
  currency: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

type PaymentState = 'select' | 'mpesa_pending' | 'processing' | 'success';

const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, desc: 'Pay via Lipa Na M-Pesa' },
  { id: 'card', label: 'Credit Card', icon: CreditCard, desc: 'Visa, Mastercard' },
  { id: 'wallet', label: 'eRide Wallet', icon: Wallet, desc: 'Use your balance' },
];

const PaymentFlow: React.FC<PaymentFlowProps> = ({ amount, currency, onPaymentComplete, onCancel }) => {
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [state, setState] = useState<PaymentState>('select');
  const [phone, setPhone] = useState('+254 7');

  const handlePay = () => {
    if (method === 'mpesa') {
      setState('mpesa_pending');
      // Simulate STK push → callback
      setTimeout(() => {
        setState('processing');
        setTimeout(() => {
          setState('success');
          setTimeout(onPaymentComplete, 1500);
        }, 1500);
      }, 3000);
    } else {
      setState('processing');
      setTimeout(() => {
        setState('success');
        setTimeout(onPaymentComplete, 1500);
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md rounded-t-3xl glass-bottom-sheet p-5 safe-bottom space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Payment</h3>
          <button onClick={onCancel} className="p-2 rounded-full bg-secondary btn-press">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {state === 'select' && (
            <motion.div key="select" exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-center text-2xl font-bold text-foreground">{currency} {amount.toLocaleString()}</p>

              {/* Method selector */}
              <div className="space-y-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors btn-press ${
                      method === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      method === m.id ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <m.icon className={`w-5 h-5 ${method === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    {method === m.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              {/* M-Pesa phone input */}
              {method === 'mpesa' && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="+254 712 345 678"
                  />
                </div>
              )}

              <button
                onClick={handlePay}
                className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm btn-press"
              >
                {method === 'mpesa' ? 'Pay with M-Pesa' : method === 'card' ? 'Pay with Card' : 'Pay from Wallet'}
              </button>
            </motion.div>
          )}

          {state === 'mpesa_pending' && (
            <motion.div
              key="mpesa"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Smartphone className="w-10 h-10 text-primary" />
              </motion.div>
              <div>
                <h4 className="font-bold text-foreground">Check your phone</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  An M-Pesa PIN prompt has been sent to<br />
                  <span className="font-mono font-medium text-foreground">{phone}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Enter your M-Pesa PIN to complete payment</p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Waiting for confirmation...</span>
              </div>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="proc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h4 className="font-bold text-foreground">Payment Successful!</h4>
              <p className="text-sm text-muted-foreground">
                {currency} {amount.toLocaleString()} — Trip Settled ✓
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default PaymentFlow;
