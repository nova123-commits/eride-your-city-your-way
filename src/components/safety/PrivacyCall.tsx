import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface PrivacyCallProps {
  recipientName: string;
}

const PrivacyCall: React.FC<PrivacyCallProps> = ({ recipientName }) => {
  const handleCall = () => {
    toast.success(`Connecting secure call to ${recipientName}...`, {
      icon: <ShieldCheck className="w-4 h-4 text-[hsl(210,80%,50%)]" />,
      description: 'Your phone number is hidden for your privacy.',
    });
  };

  return (
    <motion.button
      onClick={handleCall}
      whileTap={{ scale: 0.96 }}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[hsl(210,60%,85%)] bg-[hsl(210,60%,97%)] dark:border-[hsl(210,40%,25%)] dark:bg-[hsl(210,40%,12%)] text-[hsl(210,80%,50%)] font-medium text-sm btn-press"
    >
      <ShieldCheck className="w-4 h-4" />
      <Phone className="w-4 h-4" />
      <span>Secure eRide Call</span>
    </motion.button>
  );
};

export default PrivacyCall;
