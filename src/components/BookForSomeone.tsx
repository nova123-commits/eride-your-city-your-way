import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface GuestBooking {
  enabled: boolean;
  passengerName: string;
  passengerPhone: string;
}

interface BookForSomeoneProps {
  value: GuestBooking;
  onChange: (v: GuestBooking) => void;
}

const BookForSomeone: React.FC<BookForSomeoneProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" />
          Book for Someone Else
        </Label>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled, passengerName: '', passengerPhone: '' })}
        />
      </div>

      {value.enabled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-2 overflow-hidden"
        >
          <div className="p-3 rounded-xl bg-card border border-border space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Passenger's name"
                value={value.passengerName}
                onChange={e => onChange({ ...value, passengerName: e.target.value })}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Phone e.g. 0712345678"
                value={value.passengerPhone}
                onChange={e => onChange({ ...value, passengerPhone: e.target.value })}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Driver will contact this person directly for pickup.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BookForSomeone;
