import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';

interface CurrencyToggleProps {
  currency: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ currency, onChange }) => {
  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
      {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all btn-press ${
            currency === code
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          {CURRENCIES[code].symbol} {code}
        </button>
      ))}
    </div>
  );
};

export default CurrencyToggle;
