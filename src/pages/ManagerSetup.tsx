import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ERideLogo from "@/components/ERideLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import ReAuthModal from "@/components/ReAuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Crown, CreditCard, Gift, Users, MapPin, Clock, Loader2,
  ChevronLeft, Save, Plus, Trash2, UserPlus
} from "lucide-react";

interface FareTier {
  id: string;
  region_name: string;
  region_type: string;
  base_fare_basic: number;
  base_fare_xtra: number;
  base_fare_boda: number;
  per_km_rate: number;
  is_active: boolean;
}

interface PlatformSetting {
  key: string;
  value: string;
}

export default function ManagerSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("subscriptions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [fareTiers, setFareTiers] = useState<FareTier[]>([]);

  // Role delegation
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [allUsers, setAllUsers] = useState<{ user_id: string; role: string; full_name: string }[]>([]);

  const requireReAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setReAuthOpen(true);
  }, []);

  const handleReAuthSuccess = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [settingsRes, faresRes, rolesRes] = await Promise.all([
        supabase.from("platform_settings").select("key,value"),
        supabase.from("regional_fare_tiers").select("*").order("region_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);

      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: PlatformSetting) => { map[s.key] = s.value; });
        setSettings(map);
      }

      if (faresRes.data) setFareTiers(faresRes.data as FareTier[]);

      if (rolesRes.data) {
        const ids = rolesRes.data.map(r => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name ?? "Unknown"]) ?? []);
        setAllUsers(rolesRes.data.map(r => ({
          user_id: r.user_id,
          role: r.role,
          full_name: nameMap.get(r.user_id) ?? "Unknown",
        })));
      }

      setLoading(false);
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert(
      { key, value, updated_by: user?.id },
      { onConflict: "key" }
    );
    if (error) toast.error(`Failed to save ${key}`);
    else {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success(`${key.replace(/_/g, " ")} updated`);
      if (user) {
        await supabase.from("audit_trail").insert({
          actor_id: user.id, actor_role: "manager",
          action: `update_setting_${key}`, target_table: "platform_settings",
          details: { key, new_value: value },
        });
      }
    }
    setSaving(false);
  };

  const updateFareTier = async (tier: FareTier) => {
    const { id, ...rest } = tier;
    const { error } = await supabase.from("regional_fare_tiers")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Failed to update fare tier");
    else toast.success(`${tier.region_name} fares updated`);
  };

  const addFareTier = async () => {
    const { data, error } = await supabase.from("regional_fare_tiers").insert({
      region_name: "New Region",
      region_type: "city",
      base_fare_basic: 100,
      base_fare_xtra: 250,
      base_fare_boda: 50,
      per_km_rate: 20,
    }).select().single();
    if (error) toast.error("Failed to add region");
    else if (data) {
      setFareTiers(prev => [...prev, data as FareTier]);
      toast.success("New region added");
    }
  };

  const deleteFareTier = async (id: string) => {
    const { error } = await supabase.from("regional_fare_tiers").delete().eq("id", id);
    if (error) toast.error("Failed to delete region");
    else {
      setFareTiers(prev => prev.filter(t => t.id !== id));
      toast.success("Region removed");
    }
  };

  const handleUpgradeToAdmin = async () => {
    if (!upgradeEmail.trim()) { toast.error("Enter user email"); return; }
    setUpgrading(true);
    requireReAuth(async () => {
      // Find user by looking up profiles—we can't query auth.users directly
      // Instead, create admin via signUp (same as ManagerDashboard)
      toast.info("Use the Manager Vault → Admins tab to create admin accounts with email/password.");
      setUpgrading(false);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate("/manager")} className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <ERideLogo size="sm" />
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Crown className="w-3 h-3 mr-1" /> Setup
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Platform Setup</h1>
          <p className="text-sm text-muted-foreground mb-6">Configure subscriptions, rewards, roles, and nationwide rules.</p>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="subscriptions" className="text-xs"><CreditCard className="w-3 h-3 mr-1" />Plans</TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs"><Gift className="w-3 h-3 mr-1" />Rewards</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs"><Users className="w-3 h-3 mr-1" />Roles</TabsTrigger>
            <TabsTrigger value="nationwide" className="text-xs"><MapPin className="w-3 h-3 mr-1" />Fares</TabsTrigger>
          </TabsList>

          {/* SUBSCRIPTIONS */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Subscription Plans</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Basic Plan Price (KES)</Label>
                    <Input
                      type="number"
                      value={settings.basic_plan_price ?? "0"}
                      onChange={(e) => setSettings(prev => ({ ...prev, basic_plan_price: e.target.value }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Usually free (0 KES)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Gold Plan Price (KES/mo)</Label>
                    <Input
                      type="number"
                      value={settings.gold_plan_price ?? "1000"}
                      onChange={(e) => setSettings(prev => ({ ...prev, gold_plan_price: e.target.value }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Monthly subscription</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Gold Fee Discount (%)</Label>
                  <Input
                    type="number"
                    value={settings.gold_transaction_fee_discount ?? "50"}
                    onChange={(e) => setSettings(prev => ({ ...prev, gold_transaction_fee_discount: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Transaction fee reduction for Gold members</p>
                </div>
                <Button
                  className="w-full"
                  disabled={saving}
                  onClick={() => {
                    requireReAuth(async () => {
                      await saveSetting("basic_plan_price", settings.basic_plan_price ?? "0");
                      await saveSetting("gold_plan_price", settings.gold_plan_price ?? "1000");
                      await saveSetting("gold_transaction_fee_discount", settings.gold_transaction_fee_discount ?? "50");
                    });
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Plan Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REWARDS */}
          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Referral Rewards Engine</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Inviter Reward (KES)</Label>
                    <Input
                      type="number"
                      value={settings.referral_inviter_reward ?? "100"}
                      onChange={(e) => setSettings(prev => ({ ...prev, referral_inviter_reward: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Invitee Reward (KES)</Label>
                    <Input
                      type="number"
                      value={settings.referral_invitee_reward ?? "50"}
                      onChange={(e) => setSettings(prev => ({ ...prev, referral_invitee_reward: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={saving}
                  onClick={() => {
                    requireReAuth(async () => {
                      await saveSetting("referral_inviter_reward", settings.referral_inviter_reward ?? "100");
                      await saveSetting("referral_invitee_reward", settings.referral_invitee_reward ?? "50");
                    });
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Reward Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Role Delegation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  To create new admin accounts, use the <strong>Manager Vault → Admins</strong> tab. Below are all current users and their roles.
                </p>
                <Button variant="outline" onClick={() => navigate("/manager")}>
                  <UserPlus className="w-4 h-4 mr-2" /> Go to Manager Vault → Create Admin
                </Button>

                <Separator />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">User ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell className="text-xs font-medium">{u.full_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={u.role === "manager" ? "default" : u.role === "admin" ? "secondary" : "outline"}
                            className="text-[10px] capitalize"
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}…</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NATIONWIDE FARES */}
          <TabsContent value="nationwide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Regional Fare Tiers
                  <Button size="sm" variant="outline" onClick={addFareTier}>
                    <Plus className="w-3 h-3 mr-1" /> Add Region
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fareTiers.map((tier, i) => (
                  <div key={tier.id} className="p-4 rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Input
                          value={tier.region_name}
                          onChange={(e) => {
                            const updated = [...fareTiers];
                            updated[i] = { ...tier, region_name: e.target.value };
                            setFareTiers(updated);
                          }}
                          className="w-40 h-8 text-sm font-medium"
                        />
                        <Select
                          value={tier.region_type}
                          onValueChange={(v) => {
                            const updated = [...fareTiers];
                            updated[i] = { ...tier, region_type: v };
                            setFareTiers(updated);
                          }}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="city">City</SelectItem>
                            <SelectItem value="rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updateFareTier(tier)}>
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteFareTier(tier.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: "base_fare_basic" as const, label: "Basic" },
                        { key: "base_fare_xtra" as const, label: "Xtra" },
                        { key: "base_fare_boda" as const, label: "Boda" },
                        { key: "per_km_rate" as const, label: "Per KM" },
                      ].map(f => (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            value={tier[f.key]}
                            onChange={(e) => {
                              const updated = [...fareTiers];
                              updated[i] = { ...tier, [f.key]: Number(e.target.value) };
                              setFareTiers(updated);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Operational Hours</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.operational_hours_start ?? "05:00"}
                      onChange={(e) => setSettings(prev => ({ ...prev, operational_hours_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={settings.operational_hours_end ?? "23:00"}
                      onChange={(e) => setSettings(prev => ({ ...prev, operational_hours_end: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={saving}
                  onClick={() => {
                    requireReAuth(async () => {
                      await saveSetting("operational_hours_start", settings.operational_hours_start ?? "05:00");
                      await saveSetting("operational_hours_end", settings.operational_hours_end ?? "23:00");
                    });
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Operational Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ReAuthModal
        open={reAuthOpen}
        onOpenChange={setReAuthOpen}
        onSuccess={handleReAuthSuccess}
        title="Manager Re-authentication"
        description="This action requires your password."
      />
    </div>
  );
}
