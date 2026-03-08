import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, MapPin, Clock, Zap } from 'lucide-react';
import type { FareBreakdown } from '@/lib/currency';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';

interface DigitalReceiptProps {
  breakdown: FareBreakdown;
  currency: CurrencyCode;
  tripId: string;
  date: string;
  pickup: string;
  dropoff: string;
  distance: string;
  driverName: string;
}

const DigitalReceipt: React.FC<DigitalReceiptProps> = ({
  breakdown, currency, tripId, date, pickup, dropoff, distance, driverName,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4 max-w-sm mx-auto"
    >
      <div className="text-center">
        <Receipt className="w-6 h-6 text-primary mx-auto mb-1" />
        <h3 className="font-bold text-foreground">Digital Receipt</h3>
        <p className="text-[10px] text-muted-foreground font-mono">#{tripId}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>{pickup}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-2.5 h-2.5 text-destructive" />
          <span>{dropoff}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-2.5 h-2.5" />
          <span>{distance} · Driver: {driverName}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border pt-3 space-y-1.5 text-sm">
        <Row label="Base Fare" value={formatCurrency(breakdown.baseFare, currency)} />
        <Row label="Distance Charge" value={formatCurrency(breakdown.distanceCharge, currency)} />
        {breakdown.waitingFee > 0 && (
          <Row label="Waiting Fee" value={formatCurrency(breakdown.waitingFee, currency)} />
        )}
        <div className="border-t border-border my-1" />
        <Row label="Subtotal" value={formatCurrency(breakdown.subtotal, currency)} bold />
        <Row label="VAT (16%)" value={formatCurrency(breakdown.vat, currency)} />
        <Row label="Housing Levy (1.5%)" value={formatCurrency(breakdown.housingLevy, currency)} />
        <div className="border-t border-border my-1" />
        <Row label="Total" value={formatCurrency(breakdown.total, currency)} bold accent />
      </div>

      <p className="text-[9px] text-center text-muted-foreground">
        This is a tax-compliant digital receipt per KRA regulations 2026.
      </p>
    </motion.div>
  );
};

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`text-muted-foreground ${bold ? 'font-semibold text-foreground' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default DigitalReceipt;
