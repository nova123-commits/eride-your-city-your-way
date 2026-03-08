import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, ToggleLeft, ToggleRight } from 'lucide-react';

interface HomeDestinationFilterProps {
  onToggle?: (enabled: boolean, address: string) => void;
}

const HomeDestinationFilter: React.FC<HomeDestinationFilterProps> = ({ onToggle }) => {
  const [enabled, setEnabled] = useState(false);
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (saved && address) {
      onToggle?.(next, address);
    }
  };

  const handleSave = () => {
    if (address.trim()) {
      setSaved(true);
      onToggle?.(enabled, address.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Heading Home</span>
        </div>
        <button onClick={handleToggle} className="btn-press">
          {enabled ? (
            <ToggleRight className="w-8 h-8 text-primary" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Prioritize ride requests heading toward your home for your last trip of the day.
      </p>

      {enabled && !saved && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
          <input
            type="text"
            placeholder="Enter your home address..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSave}
            disabled={!address.trim()}
            className="w-full py-2.5 rounded-xl brand-gradient text-primary-foreground font-semibold text-xs disabled:opacity-40 btn-press"
          >
            Save Home Address
          </button>
        </motion.div>
      )}

      {enabled && saved && (
        <div className="flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-2">
          <Home className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-foreground truncate">{address}</span>
          <button onClick={() => setSaved(false)} className="ml-auto text-[10px] text-primary font-medium">Edit</button>
        </div>
      )}
    </motion.div>
  );
};

export default HomeDestinationFilter;
