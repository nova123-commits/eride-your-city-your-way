import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, addMinutes, isBefore } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ScheduleRideProps {
  onSchedule: (date: Date) => void;
  onCancel: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

const ScheduleRide: React.FC<ScheduleRideProps> = ({ onSchedule, onCancel }) => {
  const minTime = addMinutes(new Date(), 30);
  const [date, setDate] = useState<Date>(minTime);
  const [hour, setHour] = useState(minTime.getHours());
  const [minute, setMinute] = useState(Math.ceil(minTime.getMinutes() / 15) * 15 % 60);

  const handleConfirm = () => {
    const scheduled = new Date(date);
    scheduled.setHours(hour, minute, 0, 0);
    if (isBefore(scheduled, addMinutes(new Date(), 29))) return;
    onSchedule(scheduled);
  };

  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hour, minute, 0, 0);
  const isValid = !isBefore(selectedDateTime, addMinutes(new Date(), 29));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl bg-card border border-border p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Schedule for Later</span>
        </div>
        <button onClick={onCancel} className="btn-press">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "w-full justify-start text-left rounded-xl bg-secondary px-4 py-3 text-sm font-medium flex items-center gap-2",
            !date && "text-muted-foreground"
          )}>
            <CalendarIcon className="w-4 h-4 text-primary" />
            {format(date, 'PPP')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            disabled={(d) => isBefore(d, new Date(new Date().setHours(0, 0, 0, 0)))}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Hour</p>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Minute</p>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        {isValid
          ? `Pickup at ${format(selectedDateTime, 'PPp')}`
          : 'Must be at least 30 minutes from now'}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!isValid}
        className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-bold text-sm disabled:opacity-40 btn-press"
      >
        Schedule Ride
      </button>
    </motion.div>
  );
};

export default ScheduleRide;
