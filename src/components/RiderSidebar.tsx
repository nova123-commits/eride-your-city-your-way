import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Wallet, CreditCard, ShieldCheck, Gift, HelpCircle, Settings, LogOut, Car, User, DollarSign, Users } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import RiderReferralSheet from '@/components/RiderReferralSheet';

interface RiderSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RiderSidebar: React.FC<RiderSidebarProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [referralOpen, setReferralOpen] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  // Fetch wallet balance + realtime listener
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
      if (data) setWalletBalance(Number(data.balance));
    };
    fetchBalance();

    // Realtime subscription for wallet updates
    const channel = supabase
      .channel('wallet-balance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.balance !== undefined) {
            setWalletBalance(Number(payload.new.balance));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Rider';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const NAV_ITEMS = [
    { label: 'My Trips', icon: Clock, route: '/trips-history' },
    { label: 'Wallet', icon: Wallet, route: '/wallet', sub: `KES ${walletBalance.toFixed(2)}` },
    { label: 'Payment Methods', icon: CreditCard, route: '/wallet' },
    { label: 'Safety Toolkit', icon: ShieldCheck, route: '/safety-center' },
    { label: 'Rewards', icon: Gift, route: '/gold' },
    { label: 'Help', icon: HelpCircle, route: '/help' },
    { label: 'Settings', icon: Settings, route: '/settings' },
  ];

  const handleNav = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 bg-background border-r border-border flex flex-col">
        {/* Profile Header */}
        <div className="px-5 pt-8 pb-5 bg-accent/30">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-md">
                {avatarInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || 'rider'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm text-muted-foreground">4.9</span>
                <span className="text-yellow-500 text-sm">⭐</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.route)}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-accent/50 transition-colors group"
            >
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                {item.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                )}
              </div>
            </button>
          ))}
        </nav>

        <Separator />

        {/* Role-specific links */}
        <div className="px-5 py-3 space-y-1">
          {role === 'driver' ? (
            <>
              <button
                onClick={() => handleNav('/driver/dashboard')}
                className="w-full flex items-center gap-3 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                Earnings Report
              </button>
              <button
                onClick={() => handleNav('/rider')}
                className="w-full flex items-center gap-3 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <User className="w-5 h-5" />
                Switch to Rider Mode
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { onOpenChange(false); setReferralOpen(true); }}
                className="w-full flex items-center gap-3 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Gift className="w-5 h-5" />
                Earn KES 100
              </button>
              <button
                onClick={() => handleNav('/drive-with-us')}
                className="w-full flex items-center gap-3 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Car className="w-5 h-5" />
                Drive with eRide
              </button>
            </>
          )}
        </div>

        <Separator />

        {/* Logout */}
        <div className="px-5 py-4 safe-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
    <RiderReferralSheet open={referralOpen} onOpenChange={setReferralOpen} />
    </>
  );
};

export default RiderSidebar;
