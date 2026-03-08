import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceBookingProps {
  onResult: (text: string) => void;
}

const VoiceBooking: React.FC<VoiceBookingProps> = ({ onResult }) => {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-KE';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) {
        const destination = extractDestination(finalTranscript);
        onResult(destination);
        setListening(false);
        setTranscript('');
        toast({ title: 'Destination set', description: destination });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      if (event.error === 'not-allowed') {
        toast({ title: 'Microphone access denied', description: 'Please allow microphone access in your browser settings.', variant: 'destructive' });
      }
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onResult, toast]);

  const extractDestination = (text: string): string => {
    // Remove common prefixes
    const cleaned = text
      .replace(/^(take me to|go to|drive to|head to|bring me to|i want to go to|i need to go to)\s*/i, '')
      .replace(/^(the|a|an)\s+/i, '')
      .trim();
    // Capitalize first letter of each word
    return cleaned.replace(/\b\w/g, c => c.toUpperCase());
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all btn-press ${
          listening
            ? 'bg-destructive text-destructive-foreground shadow-lg'
            : 'glass-fab text-foreground hover:text-primary'
        }`}
        title="Voice booking"
      >
        {listening ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            <MicOff className="w-5 h-5" />
          </motion.div>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </motion.button>

      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-64 p-3 rounded-xl bg-card border border-border shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-3.5 h-3.5 text-destructive animate-spin" />
              <span className="text-xs font-medium text-foreground">Listening...</span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {transcript || 'Say "Take me to Jomo Kenyatta Airport"'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceBooking;
