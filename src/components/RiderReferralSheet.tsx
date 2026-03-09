import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RiderReferralSheet: React.FC<Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [reward, setReward] = useState('100');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !open) return;
    loadOrCreate();
    loadReward();
  }, [user, open]);

  const loadReward = async () => {
    const { data } = await supabase.from('platform_settings').select('value').eq('key', 'referral_inviter_reward').single();
    if (data) setReward(data.value);
  };

  const loadOrCreate = async () => {
    if (!user) return;
    setLoading(true);

    // Check existing referral code
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', user.id)
      .limit(1)
      .single();

    if (existing) {
      setCode(existing.referral_code);
      setLoading(false);
      return;
    }

    // Generate unique code: ERIDE-NAM-123
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'USR';
    const prefix = name.substring(0, 3).toUpperCase();
    const suffix = Math.floor(100 + Math.random() * 900);
    const newCode = `ERIDE-${prefix}-${suffix}`;

    const { error } = await supabase.from('referrals').insert({
      referrer_id: user.id,
      referral_code: newCode,
    });

    if (!error) setCode(newCode);
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied!');
  };

  const shareText = `🚗 Join eRide and get KES ${reward} off your first ride! Use my code: ${code}\n\nDownload now: https://eride.app`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Earn KES {reward}
          </SheetTitle>
        </SheetHeader>

        <p className="text-sm text-muted-foreground mb-4">
          Share your referral code with friends. When they complete their first ride, you both earn eRide wallet credits!
        </p>

        {loading ? (
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="flex items-center gap-2 mb-6">
            <Input
              readOnly
              value={code}
              className="font-mono text-lg font-bold tracking-wider text-center bg-accent/30"
            />
            <Button variant="outline" size="icon" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={shareWhatsApp} className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" onClick={shareSMS}>
            <Share2 className="w-4 h-4 mr-2" />
            SMS
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RiderReferralSheet;
