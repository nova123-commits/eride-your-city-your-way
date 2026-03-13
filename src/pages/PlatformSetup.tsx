import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformInit } from "@/hooks/usePlatformInit";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2, Globe, DollarSign, Car, CreditCard, Shield, Flag,
  ChevronRight, ChevronLeft, Check, Loader2, MapPin, Users, Zap
} from "lucide-react";

const STEPS = [
  { id: "identity", label: "Platform Identity", icon: Building2 },
  { id: "services", label: "Service Types", icon: Car },
  { id: "pricing", label: "Pricing Rules", icon: DollarSign },
  { id: "zones", label: "Operating Zones", icon: MapPin },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "drivers", label: "Driver Policies", icon: Users },
  { id: "safety", label: "Safety Features", icon: Shield },
  { id: "features", label: "Feature Flags", icon: Flag },
];

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_label: string;
  enabled: boolean;
  description: string;
}

export default function PlatformSetup() {
  const { user, role } = useAuth();
  const { markInitialized } = usePlatformInit();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Settings
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [fareTiers, setFareTiers] = useState<{ id: string; region_name: string; region_type: string; base_fare_basic: number; base_fare_xtra: number; base_fare_boda: number; per_km_rate: number; is_active: boolean }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [settingsRes, flagsRes, faresRes] = await Promise.all([
        supabase.from("platform_settings").select("key,value"),
        supabase.from("feature_flags").select("*").order("flag_key"),
        supabase.from("regional_fare_tiers").select("*").order("region_name"),
      ]);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
      }
      if (flagsRes.data) setFlags(flagsRes.data as FeatureFlag[]);
      if (faresRes.data) setFareTiers(faresRes.data as any[]);
    };
    load();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveCurrentStep = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_by: user?.id ?? null,
      }));
      
      // Upsert all settings
      for (const entry of entries) {
        await supabase.from("platform_settings").upsert(entry, { onConflict: "key" });
      }

      // Save feature flags if on that step
      if (STEPS[step].id === "features") {
        for (const flag of flags) {
          await supabase.from("feature_flags")
            .update({ enabled: flag.enabled, updated_by: user?.id })
            .eq("id", flag.id);
        }
      }

      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const completeSetup = async () => {
    setCompleting(true);
    await saveCurrentStep();
    await markInitialized();

    // Audit log
    if (user) {
      await supabase.from("audit_trail").insert({
        actor_id: user.id,
        actor_role: role ?? "manager",
        action: "platform_setup_completed",
        target_table: "platform_settings",
        details: { completed_at: new Date().toISOString() },
      });
    }

    toast.success("Platform setup complete! 🎉");
    setCompleting(false);
    
    if (role === "manager" || (role as string) === "super_admin") {
      navigate("/manager", { replace: true });
    } else if (role === "admin") {
      navigate("/admin/overview", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const next = async () => {
    await saveCurrentStep();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" /> First-Time Setup
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Step {step + 1} of {STEPS.length} — {currentStep.label}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep.id === "identity" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> Platform Identity
                  </CardTitle>
                  <CardDescription>Configure your company details and regional settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Company Name</Label>
                      <Input value={settings.company_name ?? "eRide"} onChange={e => updateSetting("company_name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Support Email</Label>
                      <Input type="email" value={settings.support_email ?? ""} onChange={e => updateSetting("support_email", e.target.value)} placeholder="support@eride.co.ke" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Support Phone</Label>
                      <Input value={settings.support_phone ?? ""} onChange={e => updateSetting("support_phone", e.target.value)} placeholder="+254 700 000 000" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Country</Label>
                      <Input value={settings.country ?? "Kenya"} onChange={e => updateSetting("country", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Timezone</Label>
                      <Input value={settings.timezone ?? "Africa/Nairobi"} onChange={e => updateSetting("timezone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Currency</Label>
                      <Input value={settings.currency ?? "KES"} onChange={e => updateSetting("currency", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep.id === "services" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" /> Service Types
                  </CardTitle>
                  <CardDescription>Define ride categories available on your platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Basic (Economy)", desc: "Affordable rides for everyday travel", default: true },
                    { name: "Xtra (Executive)", desc: "Premium comfort rides", default: true },
                    { name: "Boda (Motorcycle)", desc: "Quick motorcycle rides", default: true },
                    { name: "Electric", desc: "Eco-friendly electric vehicle rides", default: false },
                  ].map(svc => (
                    <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.desc}</p>
                      </div>
                      <Switch defaultChecked={svc.default} />
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground">Service types are configured via regional fare tiers. Toggle categories here for visibility.</p>
                </CardContent>
              </Card>
            )}

            {currentStep.id === "pricing" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" /> Pricing Rules
                  </CardTitle>
                  <CardDescription>Set base pricing formula: fare = base + (distance × per_km) + (time × per_min)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Base Fare ({settings.currency ?? "KES"})</Label>
                      <Input type="number" value={settings.base_fare ?? "100"} onChange={e => updateSetting("base_fare", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Per KM Price</Label>
                      <Input type="number" value={settings.per_km_price ?? "20"} onChange={e => updateSetting("per_km_price", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Per Minute Price</Label>
                      <Input type="number" value={settings.per_minute_price ?? "5"} onChange={e => updateSetting("per_minute_price", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Minimum Fare</Label>
                      <Input type="number" value={settings.minimum_fare ?? "150"} onChange={e => updateSetting("minimum_fare", e.target.value)} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs">Driver Commission (%)</Label>
                    <Input type="number" value={settings.driver_commission_percent ?? "15"} onChange={e => updateSetting("driver_commission_percent", e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Percentage deducted from each completed ride fare.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep.id === "zones" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Operating Zones
                  </CardTitle>
                  <CardDescription>Define service areas with region-specific pricing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fareTiers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No regions configured yet. Add regions in Manager Setup after completing the wizard.</p>
                  ) : (
                    fareTiers.map(tier => (
                      <div key={tier.id} className="p-3 rounded-xl border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{tier.region_name}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">{tier.region_type}</Badge>
                          </div>
                          <Badge variant={tier.is_active ? "default" : "secondary"} className="text-[10px]">
                            {tier.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                          <span>Basic: {tier.base_fare_basic}</span>
                          <span>Xtra: {tier.base_fare_xtra}</span>
                          <span>Boda: {tier.base_fare_boda}</span>
                          <span>Per KM: {tier.per_km_rate}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Operating Hours Start</Label>
                      <Input type="time" value={settings.operating_hours_start ?? "05:00"} onChange={e => updateSetting("operating_hours_start", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Operating Hours End</Label>
                      <Input type="time" value={settings.operating_hours_end ?? "23:00"} onChange={e => updateSetting("operating_hours_end", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep.id === "payments" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Payment Configuration
                  </CardTitle>
                  <CardDescription>Enable payment methods for your platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "cash_payments_enabled", label: "Cash Payments", desc: "Riders pay drivers directly in cash" },
                    { key: "mobile_money_enabled", label: "Mobile Money (M-Pesa)", desc: "STK Push payments via M-Pesa" },
                    { key: "card_payments_enabled", label: "Card Payments", desc: "Visa/Mastercard via payment gateway" },
                    { key: "wallet_payments_enabled", label: "Wallet Balance", desc: "Pay from pre-loaded eRide wallet" },
                  ].map(pm => (
                    <div key={pm.key} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      <Switch
                        checked={settings[pm.key] === "true"}
                        onCheckedChange={v => updateSetting(pm.key, v ? "true" : "false")}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {currentStep.id === "drivers" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Driver Policies
                  </CardTitle>
                  <CardDescription>Set verification and compliance requirements for drivers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Driver Verification Required</p>
                      <p className="text-xs text-muted-foreground">Drivers must be verified before going online</p>
                    </div>
                    <Switch
                      checked={settings.driver_verification_required === "true"}
                      onCheckedChange={v => updateSetting("driver_verification_required", v ? "true" : "false")}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Document Checks</p>
                      <p className="text-xs text-muted-foreground">Require license, insurance, and vehicle inspection docs</p>
                    </div>
                    <Switch
                      checked={settings.driver_document_checks === "true"}
                      onCheckedChange={v => updateSetting("driver_document_checks", v ? "true" : "false")}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Safety Terms Acceptance</p>
                      <p className="text-xs text-muted-foreground">Drivers must accept safety manual before first trip</p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep.id === "safety" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Safety Features
                  </CardTitle>
                  <CardDescription>Configure safety systems for riders and drivers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "sos_system", label: "SOS Emergency System", desc: "One-tap emergency alert with location sharing" },
                    { key: "trusted_contacts", label: "Trusted Contacts", desc: "Riders can share trip details with contacts" },
                    { key: "selfie_verification", label: "Selfie Verification", desc: "Photo verification before ride starts" },
                  ].map(sf => {
                    const flag = flags.find(f => f.flag_key === sf.key);
                    return (
                      <div key={sf.key} className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{sf.label}</p>
                          <p className="text-xs text-muted-foreground">{sf.desc}</p>
                        </div>
                        <Switch
                          checked={flag?.enabled ?? false}
                          onCheckedChange={v => {
                            setFlags(prev => prev.map(f => f.flag_key === sf.key ? { ...f, enabled: v } : f));
                          }}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {currentStep.id === "features" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-primary" /> Feature Flags
                  </CardTitle>
                  <CardDescription>Enable or disable optional platform features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {flags
                    .filter(f => !["sos_system", "trusted_contacts", "selfie_verification"].includes(f.flag_key))
                    .map(flag => (
                      <div key={flag.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{flag.flag_label}</p>
                          <p className="text-xs text-muted-foreground">{flag.description}</p>
                        </div>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={v => {
                            setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: v } : f));
                          }}
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <span className="text-xs text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          {isLast ? (
            <Button onClick={completeSetup} disabled={completing} className="bg-primary">
              {completing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              Complete Setup
            </Button>
          ) : (
            <Button onClick={next} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
