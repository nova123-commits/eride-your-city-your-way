import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Car, Users, AlertTriangle, Phone, Bike, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ERideLogo from '@/components/ERideLogo';

const SECTIONS = [
  {
    icon: Shield,
    title: '1. Safety First',
    items: [
      'Safety is eRide's #1 priority — for drivers, riders, and the community.',
      'Every driver must complete safety onboarding before their first trip.',
      'Violations of safety protocols may result in suspension or removal.',
    ],
  },
  {
    icon: Car,
    title: '2. Vehicle & Readiness',
    items: [
      'Keep your vehicle clean, fueled, and mechanically sound at all times.',
      'Carry a valid PSV license, NTSA badge, insurance certificate, and first-aid kit.',
      'Vehicles must be model year 2018 or newer with functional air conditioning.',
      'Conduct a pre-trip check daily before going online.',
    ],
  },
  {
    icon: Bike,
    title: '3. Boda-Boda Specific',
    items: [
      'Always carry a spare helmet for your passenger.',
      'Wear your eRide-branded reflector vest at all times.',
      'Ensure your bike has enough fuel for at least a 10 km trip before going online.',
      'Complete the daily 3-point safety checklist before accepting rides.',
    ],
  },
  {
    icon: Users,
    title: '4. Rider Interaction',
    items: [
      'Verify the rider using the 4-digit OTP before starting every trip.',
      'Respect "Silent Trip" preferences — greet briefly, then minimize conversation.',
      'Never refuse a trip based on the rider's destination, gender, or appearance.',
      'For "Guest" bookings, greet the guest by the name shown in the app.',
      'Keep the vehicle temperature comfortable and music at a low volume.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '5. Emergency Protocols',
    items: [
      'If a rider triggers the SOS button, remain calm — eRide admin is alerted instantly with your GPS coordinates.',
      'In case of an accident, ensure passenger safety first, then report via the app.',
      'Never disable location sharing during an active trip.',
      'Report any suspicious activity or safety concerns to admin immediately.',
    ],
  },
  {
    icon: Phone,
    title: '6. Platform & Communication Rules',
    items: [
      'Do not contact riders on personal phone numbers after a trip ends.',
      'Use the in-app masked calling feature for trip-related communication.',
      'Do not share rider information with third parties.',
      'Maintain a rating above 4.5 to stay active on the platform.',
    ],
  },
  {
    icon: Star,
    title: '7. Performance & Accountability',
    items: [
      'Repeated cancellations will lower your commitment score and reduce ride visibility.',
      'Drivers with commitment scores below 70 may face temporary deactivation.',
      'Gold Member rides receive 0% surge — do not attempt to charge extra.',
      'All trips are logged and auditable by eRide management for compliance.',
    ],
  },
];

const DriverManual: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <ERideLogo size="sm" />
        <h1 className="text-base font-bold text-foreground ml-1">Driver Safety Manual</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Intro */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">
              This manual outlines the standards and responsibilities every eRide driver must follow.
              By accepting the Safety Terms during onboarding, you commit to upholding these guidelines
              on every trip. Failure to comply may result in warnings, suspension, or permanent removal
              from the platform.
            </p>
          </div>

          {/* Sections */}
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">{section.title}</h2>
                </div>
                <ul className="space-y-2 pl-[42px]">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="pt-4 pb-8 text-center">
            <p className="text-xs text-muted-foreground">
              Last updated: March 2026 · eRide Trust & Safety Team
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DriverManual;
