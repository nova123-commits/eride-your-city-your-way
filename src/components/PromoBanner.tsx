import { motion } from "framer-motion";
import { Gift, X } from "lucide-react";
import { useState } from "react";

export default function PromoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      className="mx-4 mt-3 rounded-2xl brand-gradient p-3.5 flex items-center gap-3 relative"
    >
      <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary-foreground">Invite a friend 🎉</p>
        <p className="text-xs text-primary-foreground/80">Get KES 200 off your next trip!</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center"
      >
        <X className="w-3 h-3 text-primary-foreground" />
      </button>
    </motion.div>
  );
}
