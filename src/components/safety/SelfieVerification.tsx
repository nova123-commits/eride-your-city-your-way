import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Camera, CheckCircle2, Loader2 } from 'lucide-react';

interface SelfieVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
}

type VerifyState = 'prompt' | 'scanning' | 'success';

const SelfieVerification: React.FC<SelfieVerificationProps> = ({ onVerified, onCancel }) => {
  const [state, setState] = useState<VerifyState>('prompt');

  const handleCapture = () => {
    setState('scanning');
    // Simulate biometric verification
    setTimeout(() => {
      setState('success');
      setTimeout(onVerified, 1200);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-[hsl(210,60%,90%)] bg-[hsl(210,60%,97%)] dark:border-[hsl(210,40%,25%)] dark:bg-[hsl(210,40%,12%)] p-6 space-y-5"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(210,80%,50%)]/10 flex items-center justify-center mb-3">
            <Fingerprint className="w-8 h-8 text-[hsl(210,80%,50%)]" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Identity Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please look into the camera to verify your identity.
          </p>
        </div>

        {/* Camera viewfinder simulation */}
        <div className="relative aspect-square max-w-[200px] mx-auto rounded-full overflow-hidden border-4 border-[hsl(210,80%,50%)]/30">
          <div className="absolute inset-0 bg-secondary flex items-center justify-center">
            <AnimatePresence mode="wait">
              {state === 'prompt' && (
                <motion.div key="cam" exit={{ opacity: 0 }}>
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </motion.div>
              )}
              {state === 'scanning' && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Loader2 className="w-10 h-10 text-[hsl(210,80%,50%)] animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Scanning...</p>
                </motion.div>
              )}
              {state === 'success' && (
                <motion.div
                  key="done"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <CheckCircle2 className="w-14 h-14 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scanning line animation */}
          {state === 'scanning' && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-[hsl(210,80%,50%)]"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <AnimatePresence mode="wait">
          {state === 'prompt' && (
            <motion.div key="actions" exit={{ opacity: 0 }} className="space-y-2">
              <button
                onClick={handleCapture}
                className="w-full py-3.5 rounded-xl bg-[hsl(210,80%,50%)] text-white font-semibold text-sm btn-press"
              >
                Verify My Identity
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm"
              >
                Cancel
              </button>
            </motion.div>
          )}
          {state === 'success' && (
            <motion.p
              key="msg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm font-semibold text-primary"
            >
              ✓ Identity Verified — You're good to go!
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SelfieVerification;
