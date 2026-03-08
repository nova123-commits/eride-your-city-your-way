import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Snowflake, Music, ChevronLeft } from 'lucide-react';

export interface RidePrefs {
  silentTrip: boolean;
  acPreference: 'none' | 'cool' | 'warm';
  musicGenre: string;
}

interface RidePreferencesProps {
  prefs: RidePrefs;
  onChange: (prefs: RidePrefs) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const MUSIC_GENRES = ['No Music', 'Afrobeats', 'Gospel', 'R&B', 'Jazz', 'Lo-Fi'];

const RidePreferences: React.FC<RidePreferencesProps> = ({ prefs, onChange, onConfirm, onBack }) => {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h3 className="font-bold text-foreground">Customize My Ride</h3>
      </div>

      {/* Silent Trip */}
      <button
        onClick={() => onChange({ ...prefs, silentTrip: !prefs.silentTrip })}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
          prefs.silentTrip ? 'border-primary bg-accent' : 'border-border bg-card'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prefs.silentTrip ? 'brand-gradient' : 'bg-secondary'}`}>
          <Volume2 className={`w-5 h-5 ${prefs.silentTrip ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </div>
        <div className="text-left flex-1">
          <p className="font-semibold text-foreground text-sm">Silent Trip</p>
          <p className="text-xs text-muted-foreground">No conversation with driver</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${prefs.silentTrip ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
          {prefs.silentTrip && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
        </div>
      </button>

      {/* AC Preference */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Snowflake className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-sm">AC Preference</p>
        </div>
        <div className="flex gap-2">
          {(['none', 'cool', 'warm'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...prefs, acPreference: opt })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                prefs.acPreference === opt
                  ? 'brand-gradient text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {opt === 'none' ? 'Off' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Music Genre */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Music className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-sm">Music Genre</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => onChange({ ...prefs, musicGenre: genre })}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
        className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm active:scale-[0.98]"
      >
        Confirm & Request Ride
      </motion.button>
    </motion.div>
  );
};

export default RidePreferences;
