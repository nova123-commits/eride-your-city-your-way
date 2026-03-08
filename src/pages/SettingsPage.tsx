import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Bell, Lock, Globe, Moon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import RoleNav from '@/components/RoleNav';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Profile updated successfully.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Profile Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profile
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        <Separator />

        {/* Preferences */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Push Notifications</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Dark Mode</span>
            </div>
            <Switch />
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <button onClick={() => navigate('/legal')} className="w-full flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-primary" />
              <span>Privacy & Legal</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>
      </div>
      <RoleNav />
    </div>
  );
};

export default SettingsPage;
