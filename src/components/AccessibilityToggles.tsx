import React from 'react';
import { motion } from 'framer-motion';
import { Accessibility, Luggage } from 'lucide-react';

export interface AccessibilityPrefs {
  wheelchair: boolean;
  extraLuggage: boolean;
}

interface AccessibilityTogglesProps {
  prefs: AccessibilityPrefs;
  onChange: (prefs: AccessibilityPrefs) => void;
}

const AccessibilityToggles: React.FC<AccessibilityTogglesProps> = ({ prefs, onChange }) => {
  const toggles = [
    { key: 'wheelchair' as const, label: 'Wheelchair Accessible', icon: Accessibility },
    { key: 'extraLuggage' as const, label: 'Extra Luggage', icon: Luggage },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground font-medium">Accessibility & Extras</p>
      <div className="flex gap-2">
        {toggles.map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ ...prefs, [key]: !prefs[key] })}
            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
              prefs[key]
                ? 'border-primary bg-accent text-foreground'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <Icon className={`w-4 h-4 ${prefs[key] ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityToggles;
