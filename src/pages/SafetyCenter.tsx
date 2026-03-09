import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Phone, MapPin, AlertTriangle, Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SOSButton from '@/components/safety/SOSButton';
import PinkModeToggle from '@/components/safety/PinkModeToggle';
import RoleNav from '@/components/RoleNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
}

const SAFETY_FEATURES = [
  { icon: MapPin, title: 'Live Location Sharing', desc: 'Let loved ones track your ride on a live map.' },
  { icon: AlertTriangle, title: 'Trip Check-In', desc: 'Get automatic check-in prompts during long trips.' },
  { icon: Users, title: 'Verified Drivers', desc: 'All drivers are background-checked and verified.' },
];

const SafetyCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pinkMode, setPinkMode] = React.useState(false);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('trusted_contacts').select('id,name,phone').eq('user_id', user.id).order('created_at').then(({ data }: any) => {
      if (data) setContacts(data);
    });
  }, [user]);

  const addContact = async () => {
    if (!user || !newName.trim() || !newPhone.trim()) return;
    if (contacts.length >= 3) {
      toast.error('Maximum 3 trusted contacts allowed.');
      return;
    }
    if (!/^(\+?254|0)7\d{8}$/.test(newPhone.trim())) {
      toast.error('Enter a valid Kenyan phone number.');
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase as any).from('trusted_contacts').insert({
      user_id: user.id,
      name: newName.trim(),
      phone: newPhone.trim(),
    }).select().single();
    if (!error && data) {
      setContacts(prev => [...prev, data]);
      toast.success(`${newName.trim()} added as trusted contact.`);
      setNewName('');
      setNewPhone('');
      setShowAdd(false);
    } else {
      toast.error('Failed to add contact.');
    }
    setSaving(false);
  };

  const removeContact = async (id: string) => {
    await (supabase as any).from('trusted_contacts').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    toast('Contact removed.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Safety Center</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <SOSButton />
        <PinkModeToggle enabled={pinkMode} onToggle={setPinkMode} />

        {/* Trusted Contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Trusted Contacts
            </h2>
            {contacts.length < 3 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(true)}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">These contacts receive a tracking link when your ride starts.</p>

          {contacts.length === 0 && !showAdd && (
            <button onClick={() => setShowAdd(true)} className="w-full p-4 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground hover:border-primary/40 transition-colors">
              <UserPlus className="w-5 h-5 mx-auto mb-1 text-primary" />
              Add your first trusted contact
            </button>
          )}

          {contacts.map(c => (
            <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <button onClick={() => removeContact(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </motion.div>
          ))}

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <Input placeholder="Contact name" value={newName} onChange={e => setNewName(e.target.value)} />
                  <Input placeholder="Phone e.g. 0712345678" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
                    <Button size="sm" onClick={addContact} disabled={saving} className="flex-1">
                      {saving ? 'Saving...' : 'Save Contact'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3 mt-4">
          <h2 className="text-sm font-semibold text-foreground">Safety Features</h2>
          {SAFETY_FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <RoleNav />
    </div>
  );
};

export default SafetyCenter;
