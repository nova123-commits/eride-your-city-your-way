import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Plus, X } from 'lucide-react';
import { WAITING_FEE_PER_MIN } from '@/lib/ride';

export interface ErrandStopData {
  address: string;
  waitMinutes: number;
}

interface ErrandStopProps {
  stop: ErrandStopData | null;
  onAdd: (stop: ErrandStopData) => void;
  onRemove: () => void;
}

const WAIT_OPTIONS = [5, 10, 15];

const ErrandStop: React.FC<ErrandStopProps> = ({ stop, onAdd, onRemove }) => {
  const [address, setAddress] = React.useState(stop?.address || '');
  const [waitMins, setWaitMins] = React.useState(stop?.waitMinutes || 5);
  const [isAdding, setIsAdding] = React.useState(false);

  if (stop) {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="flex items-center gap-3 p-3 rounded-xl glass-panel border-primary/20"
      >
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{stop.address}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{stop.waitMinutes} min wait · KES {stop.waitMinutes * WAITING_FEE_PER_MIN} fee</span>
          </div>
        </div>
        <button onClick={onRemove} className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center btn-press">
          <X className="w-3 h-3 text-destructive" />
        </button>
      </motion.div>
    );
  }

  if (!isAdding) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border text-muted-foreground text-xs font-medium hover:border-primary/40 transition-colors btn-press"
      >
        <Plus className="w-4 h-4" />
        Add an errand stop
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="p-3 rounded-xl glass-panel space-y-3"
    >
      <input
        type="text"
        placeholder="Stop address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Wait time</p>
        <div className="flex gap-2">
          {WAIT_OPTIONS.map((mins) => (
            <button
              key={mins}
              onClick={() => setWaitMins(mins)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all btn-press ${
                waitMins === mins ? 'brand-gradient text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsAdding(false)} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-xs font-medium btn-press">
          Cancel
        </button>
        <button
          onClick={() => { if (address.length > 2) onAdd({ address, waitMinutes: waitMins }); }}
          disabled={address.length < 3}
          className="flex-1 py-2 rounded-lg brand-gradient text-primary-foreground text-xs font-semibold disabled:opacity-40 btn-press"
        >
          Add Stop
        </button>
      </div>
    </motion.div>
  );
};

export default ErrandStop;
