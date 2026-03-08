import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircleOff, MessageCircle, Snowflake, Wind, Music, ChevronLeft } from 'lucide-react';

export interface RidePrefs {
  conversation: 'quiet' | 'open';
  temperature: 'ac_high' | 'ac_low' | 'windows';
  musicGenre: string;
}

interface RidePreferencesProps {
  prefs: RidePrefs;
  onChange: (prefs: RidePrefs) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const MUSIC_GENRES = ['None', 'Afrobeat', 'Chill Lofi', 'News', 'Gospel', 'R&B'];

const TEMP_OPTIONS: { value: RidePrefs['temperature']; label: string; icon: React.ReactNode }[] = [
  { value: 'ac_high', label: 'AC High', icon: <Snowflake className="w-3.5 h-3.5" /> },
  { value: 'ac_low', label: 'AC Low', icon: <Snowflake className="w-3.5 h-3.5 opacity-50" /> },
  { value: 'windows', label: 'Windows Down', icon: <Wind className="w-3.5 h-3.5" /> },
];

const RidePreferences: React.FC<RidePreferencesProps> = ({ prefs, onChange, onConfirm, onBack }) => {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-8 h-8 rounded-lg glass-fab flex items-center justify-center btn-press">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h3 className="font-bold text-foreground">Ride Vibe</h3>
        <span className="text-xs text-muted-foreground ml-auto">Customize your experience</span>
      </div>

      {/* Conversation */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            {prefs.conversation === 'quiet'
              ? <MessageCircleOff className="w-5 h-5 text-muted-foreground" />
              : <MessageCircle className="w-5 h-5 text-primary" />}
          </div>
          <p className="font-semibold text-foreground text-sm">Conversation</p>
        </div>
        <div className="flex gap-2">
          {(['quiet', 'open'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...prefs, conversation: opt })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all btn-press ${
                prefs.conversation === opt
                  ? 'brand-gradient text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {opt === 'quiet' ? '🤫 Quiet' : '💬 Open to Chat'}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Snowflake className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-sm">Temperature</p>
        </div>
        <div className="flex gap-2">
          {TEMP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...prefs, temperature: opt.value })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all btn-press flex items-center justify-center gap-1.5 ${
                prefs.temperature === opt.value
                  ? 'brand-gradient text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Music Genre */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Music className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-sm">Music</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => onChange({ ...prefs, musicGenre: genre })}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all btn-press ${
                prefs.musicGenre === genre
                  ? 'brand-gradient text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onConfirm}
        className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm btn-press-deep"
      >
        Confirm & Request Ride
      </motion.button>
    </motion.div>
  );
};

export default RidePreferences;
