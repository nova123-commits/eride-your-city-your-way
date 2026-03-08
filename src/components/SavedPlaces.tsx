import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, MapPin, Plus, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SavedPlace {
  id: string;
  label: string;
  address: string;
}

interface SavedPlacesProps {
  onSelect: (address: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  Work: <Briefcase className="w-4 h-4" />,
};

const SavedPlaces: React.FC<SavedPlacesProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setPlaces(data.map(d => ({ id: d.id, label: d.label, address: d.address })));
      });
  }, [user]);

  const handleSave = async () => {
    if (!user || newAddress.length < 3) return;
    const { data, error } = await supabase
      .from('saved_addresses')
      .insert({ user_id: user.id, label: newLabel, address: newAddress })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) setPlaces(prev => [...prev, { id: data.id, label: data.label, address: data.address }]);
    setAdding(false);
    setNewAddress('');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('saved_addresses').delete().eq('id', id);
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  if (!user) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Saved Places</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-primary btn-press">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {places.map((place) => (
          <motion.button
            key={place.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => onSelect(place.address)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/40 transition-all btn-press text-left"
          >
            <span className="text-primary">
              {ICONS[place.label] || <MapPin className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{place.label}</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{place.address}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(place.id); }}
              className="opacity-0 group-hover:opacity-100 ml-1 text-destructive transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="rounded-xl glass-panel p-3 space-y-2"
          >
            <div className="flex gap-2">
              {['Home', 'Work'].map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => setNewLabel(lbl)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                    newLabel === lbl ? 'brand-gradient text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Enter address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-xs font-medium btn-press">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={newAddress.length < 3}
                className="flex-1 py-2 rounded-lg brand-gradient text-primary-foreground text-xs font-semibold disabled:opacity-40 btn-press"
              >
                <Check className="w-3 h-3 inline mr-1" />Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedPlaces;
