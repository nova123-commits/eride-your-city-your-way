import React from 'react';
import { ArrowLeft, ShieldCheck, Phone, MapPin, AlertTriangle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SOSButton from '@/components/safety/SOSButton';
import PinkModeToggle from '@/components/safety/PinkModeToggle';
import RoleNav from '@/components/RoleNav';

const SAFETY_FEATURES = [
  { icon: Phone, title: 'Emergency Contacts', desc: 'Share your trip with trusted contacts in real-time.' },
  { icon: MapPin, title: 'Live Location Sharing', desc: 'Let loved ones track your ride on a live map.' },
  { icon: AlertTriangle, title: 'Trip Check-In', desc: 'Get automatic check-in prompts during long trips.' },
  { icon: Users, title: 'Verified Drivers', desc: 'All drivers are background-checked and verified.' },
];

const SafetyCenter: React.FC = () => {
  const navigate = useNavigate();
  const [pinkMode, setPinkMode] = React.useState(false);

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
