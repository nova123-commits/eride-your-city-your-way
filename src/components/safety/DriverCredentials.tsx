import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface DriverCredentialsProps {
  driverName: string;
  psvLicense: string;
  expiryDate: string;
  isVerified: boolean;
}

const DriverCredentials: React.FC<DriverCredentialsProps> = ({
  driverName,
  psvLicense,
  expiryDate,
  isVerified,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[hsl(210,60%,90%)] bg-[hsl(210,60%,97%)] dark:border-[hsl(210,40%,25%)] dark:bg-[hsl(210,40%,12%)] p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[hsl(210,80%,50%)]" />
        <h3 className="font-semibold text-sm text-foreground">Driver Credentials</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>PSV License</span>
          </div>
          <span className="text-sm font-mono font-medium text-foreground">{psvLicense}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Expires</span>
          </div>
          <span className="text-sm text-foreground">{expiryDate}</span>
        </div>
      </div>

      {isVerified ? (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10"
        >
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">NTSA Verified Driver</span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
          <span className="text-xs font-semibold text-destructive">Verification Pending</span>
        </div>
      )}
    </motion.div>
  );
};

export default DriverCredentials;
