import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Headphones, Star, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERideLogo from '@/components/ERideLogo';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BENEFITS = [
  { icon: Zap, title: '0% Surge Pricing', desc: 'Never pay extra during peak hours' },
  { icon: Shield, title: 'Priority Support', desc: '24/7 dedicated support line' },
  { icon: Star, title: 'Priority Matching', desc: 'Get matched with drivers first' },
  { icon: Headphones, title: 'Concierge Service', desc: 'Personal ride assistant on demand' },
];

const GoldMember: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>('basic');
  const [goldPrice, setGoldPrice] = useState<number>(1000);
  const [feeDiscount, setFeeDiscount] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [settingsRes, profileRes] = await Promise.all([
        supabase.from('platform_settings').select('key,value').in('key', ['gold_plan_price', 'gold_transaction_fee_discount']),
        user ? supabase.from('profiles').select('subscription_plan').eq('id', user.id).single() : Promise.resolve({ data: null }),
      ]);

      if (settingsRes.data) {
        const price = settingsRes.data.find(s => s.key === 'gold_plan_price');
        if (price) setGoldPrice(Number(price.value));
        const disc = settingsRes.data.find(s => s.key === 'gold_transaction_fee_discount');
        if (disc) setFeeDiscount(Number(disc.value));
      }

      if (profileRes.data && 'subscription_plan' in profileRes.data) {
        setPlan((profileRes.data as any).subscription_plan ?? 'basic');
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) { toast.error('Please sign in first'); return; }
    setUpgrading(true);

    // Check wallet balance
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
    const balance = wallet?.balance ?? 0;

    if (balance < goldPrice) {
      toast.error(`Insufficient balance. You need KES ${goldPrice.toLocaleString()} but have KES ${balance.toLocaleString()}.`);
      setUpgrading(false);
      return;
    }

    // Deduct from wallet
    const { error: walletError } = await supabase.from('wallets')
      .update({ balance: balance - goldPrice, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (walletError) { toast.error('Payment failed'); setUpgrading(false); return; }

    // Log transaction
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      amount: goldPrice,
      type: 'debit',
      label: 'Gold Plan Subscription',
      status: 'completed',
    });

    // Update profile plan
    const { error: profileError } = await supabase.from('profiles')
      .update({ subscription_plan: 'gold' })
      .eq('id', user.id);

    if (profileError) { toast.error('Upgrade failed'); setUpgrading(false); return; }

    setPlan('gold');
    toast.success('🎉 Welcome to eRide Gold!');
    setUpgrading(false);
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setUpgrading(true);
    const { error } = await supabase.from('profiles')
      .update({ subscription_plan: 'basic' })
      .eq('id', user.id);

    if (error) toast.error('Downgrade failed');
    else { setPlan('basic'); toast.success('Downgraded to Basic plan'); }
    setUpgrading(false);
  };

  const isGold = plan === 'gold';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent" />

        <div className="relative px-5 pt-4 pb-8 safe-top">
          <button
            onClick={() => navigate('/rider')}
            className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center mb-6"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20"
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-foreground mb-1">
              <span className="text-brand-gradient">eRide</span> Gold
            </h1>
            <p className="text-sm text-muted-foreground">The ultimate ride experience</p>
            {isGold && (
              <Badge className="mt-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                <Check className="w-3 h-3 mr-1" /> Active Gold Member
              </Badge>
            )}
          </motion.div>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 -mt-2 space-y-3">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-4 p-4 rounded-2xl glass-panel"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
            {isGold && <Check className="w-4 h-4 text-primary ml-auto" />}
          </motion.div>
        ))}

        {/* Extra Gold perk */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 p-4 rounded-2xl glass-panel border border-yellow-500/20"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-yellow-500">{feeDiscount}%</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Lower Transaction Fees</p>
            <p className="text-xs text-muted-foreground">{feeDiscount}% discount on all transaction fees</p>
          </div>
          {isGold && <Check className="w-4 h-4 text-primary ml-auto" />}
        </motion.div>
      </div>

      {/* Pricing */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-5 mt-6 pb-8 safe-bottom"
        >
          <div className="p-5 rounded-3xl border-2 border-yellow-500/30 glass-panel text-center space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Monthly subscription</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-foreground">{goldPrice.toLocaleString()}</span>
              <span className="text-sm font-semibold text-muted-foreground">KES/mo</span>
            </div>
            <p className="text-xs text-muted-foreground">Cancel anytime · Billed monthly</p>

            {isGold ? (
              <div className="space-y-2">
                <div className="py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm">
                  ✨ You're a Gold Member
                </div>
                <button
                  onClick={handleDowngrade}
                  disabled={upgrading}
                  className="w-full py-3 rounded-2xl border border-border text-muted-foreground text-sm hover:bg-accent transition-colors"
                >
                  {upgrading ? 'Processing...' : 'Downgrade to Basic'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading || loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {upgrading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  'Become a Gold Member'
                )}
              </button>
            )}
            <p className="text-[10px] text-muted-foreground">Deducted from your eRide wallet</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GoldMember;
