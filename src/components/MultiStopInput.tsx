import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin } from 'lucide-react';

interface MultiStopInputProps {
  stops: string[];
  onStopsChange: (stops: string[]) => void;
  maxStops?: number;
}

const MultiStopInput: React.FC<MultiStopInputProps> = ({ stops, onStopsChange, maxStops = 2 }) => {
  const addStop = () => {
    if (stops.length < maxStops) {
      onStopsChange([...stops, '']);
    }
  };

  const removeStop = (index: number) => {
    onStopsChange(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, value: string) => {
    const updated = [...stops];
    updated[index] = value;
    onStopsChange(updated);
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {stops.map((stop, i) => (
          <motion.div
            key={i}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-col items-center">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <input
              type="text"
              placeholder={`Stop ${i + 1}`}
              value={stop}
              onChange={(e) => updateStop(i, e.target.value)}
              className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              onClick={() => removeStop(i)}
              className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center btn-press"
            >
              <X className="w-3 h-3 text-destructive" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {stops.length < maxStops && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={addStop}
          className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors btn-press px-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add stop ({stops.length}/{maxStops})
        </motion.button>
      )}

      {stops.length > 0 && (
        <p className="text-[10px] text-muted-foreground px-1">
          +KES 40 stop fee per additional stop (5 min wait)
        </p>
      )}
    </div>
  );
};

export default MultiStopInput;
