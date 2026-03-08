import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LiveTripShareProps {
  pickup: string;
  destination: string;
  driverName: string;
  vehicle: string;
  plate: string;
}

const LiveTripShare: React.FC<LiveTripShareProps> = ({ pickup, destination, driverName, vehicle, plate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateShareLink = async () => {
    if (!user) return;
    setLoading(true);
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const { error } = await supabase.from('shared_trips').insert({
      user_id: user.id,
      share_token: token,
      pickup,
      destination,
      driver_name: driverName,
      vehicle,
      plate,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const url = `${window.location.origin}/trip/${token}`;
      setShareUrl(url);
    }
    setLoading(false);
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shareUrl) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={generateShareLink}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:border-primary/40 transition-all btn-press w-full justify-center"
      >
        <Share2 className="w-4 h-4 text-primary" />
        {loading ? 'Generating...' : 'Share Live Trip'}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass-panel p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Trip shared!</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 rounded-lg bg-secondary px-3 py-2 text-[11px] text-muted-foreground truncate"
        />
        <button onClick={copyLink} className="p-2 rounded-lg bg-primary text-primary-foreground btn-press">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">Anyone with this link can track your trip in real-time.</p>
    </motion.div>
  );
};

export default LiveTripShare;
