import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ERideLogo from "@/components/ERideLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReAuthModal from "@/components/ReAuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Crown, Shield, Eye, Users, DollarSign, FileText, ToggleLeft,
  ArrowDownCircle, Percent, Loader2, RefreshCw, UserCheck, Ban, Undo2,
  Lock, Snowflake, UserPlus, MonitorSmartphone, AlertTriangle
} from "lucide-react";
import SystemHealth from "@/components/admin/SystemHealth";
import LiveSOSAlerts from "@/components/admin/LiveSOSAlerts";

interface AdminPerm {
  id: string;
  admin_user_id: string;
  can_approve_drivers: boolean;
  can_view_revenue: boolean;
  can_issue_refunds: boolean;
  can_delete_users: boolean;
  full_name?: string;
}

interface AuditEntry {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export default function ManagerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("vault");
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // View mode toggle (rider/driver preview without changing DB role)
  const [viewMode, setViewMode] = useState<"manager" | "rider" | "driver">("manager");

  // Overview state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [commission, setCommission] = useState(15);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const [systemFrozen, setSystemFrozen] = useState(false);

  // Permissions state
  const [admins, setAdmins] = useState<AdminPerm[]>([]);
  const [permLoading, setPermLoading] = useState(true);

  // Audit state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  // Create admin state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Double-check payout modal
  const [payoutConfirmOpen, setPayoutConfirmOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  const requireReAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setReAuthOpen(true);
  }, []);

  const handleReAuthSuccess = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  // Fetch overview data
  useEffect(() => {
    const fetchOverview = async () => {
      const [txRes, walletRes, settingsRes] = await Promise.all([
        supabase.from("wallet_transactions").select("amount,fee,type"),
        supabase.from("wallets").select("id"),
        supabase.from("platform_settings").select("key,value").in("key", ["global_commission", "system_frozen"]),
      ]);

      if (txRes.data) {
        const rev = txRes.data.reduce((sum, t) => sum + Number(t.amount), 0);
        const fees = txRes.data.reduce((sum, t) => sum + Number(t.fee), 0);
        setTotalRevenue(rev);
        setTotalFees(fees);
      }
      setWalletCount(walletRes.data?.length ?? 0);

      const commSetting = settingsRes.data?.find(s => s.key === "global_commission");
      if (commSetting) setCommission(Number(commSetting.value));

      const frozenSetting = settingsRes.data?.find(s => s.key === "system_frozen");
      if (frozenSetting) setSystemFrozen(frozenSetting.value === "true");
    };
    fetchOverview();
  }, []);

  // Fetch admin permissions
  useEffect(() => {
    const fetchPerms = async () => {
      setPermLoading(true);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!roles?.length) { setPermLoading(false); return; }

      const adminIds = roles.map(r => r.user_id);

      const { data: perms } = await supabase
        .from("admin_permissions")
        .select("*")
        .in("admin_user_id", adminIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", adminIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) ?? []);

      const merged: AdminPerm[] = adminIds.map(aid => {
        const existing = perms?.find(p => p.admin_user_id === aid);
        return {
          id: existing?.id ?? "",
          admin_user_id: aid,
          can_approve_drivers: existing?.can_approve_drivers ?? true,
          can_view_revenue: existing?.can_view_revenue ?? true,
          can_issue_refunds: existing?.can_issue_refunds ?? false,
          can_delete_users: existing?.can_delete_users ?? false,
          full_name: profileMap.get(aid) ?? "Admin",
        };
      });

      setAdmins(merged);
      setPermLoading(false);
    };
    fetchPerms();
  }, []);

  // Fetch audit trail
  useEffect(() => {
    const fetchAudit = async () => {
      setAuditLoading(true);
      const { data } = await supabase
        .from("audit_trail")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setAuditLog((data as AuditEntry[]) ?? []);
      setAuditLoading(false);
    };
    fetchAudit();
  }, []);

  const updateCommission = (value: number) => {
    requireReAuth(async () => {
      setCommissionLoading(true);
      const { error } = await supabase.from("platform_settings").upsert({
        key: "global_commission",
        value: String(value),
        updated_by: user?.id,
      }, { onConflict: "key" });

      if (error) toast.error("Failed to update commission");
      else {
        setCommission(value);
        toast.success(`Commission set to ${value}%`);
        if (user) {
          await supabase.from("audit_trail").insert({
            actor_id: user.id,
            actor_role: "manager",
            action: "update_commission",
            target_table: "platform_settings",
            details: { new_value: value },
          });
        }
      }
      setCommissionLoading(false);
    });
  };

  const toggleAdminPerm = async (adminId: string, field: string, value: boolean) => {
    const existing = admins.find(a => a.admin_user_id === adminId);
    if (!existing) return;

    if (existing.id) {
      await supabase.from("admin_permissions").update({ [field]: value, updated_by: user?.id, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("admin_permissions").insert({
        admin_user_id: adminId,
        [field]: value,
        updated_by: user?.id,
      });
    }

    setAdmins(prev => prev.map(a => a.admin_user_id === adminId ? { ...a, [field]: value } : a));

    if (user) {
      await supabase.from("audit_trail").insert({
        actor_id: user.id,
        actor_role: "manager",
        action: `toggle_admin_${field}`,
        target_table: "admin_permissions",
        target_id: adminId,
        details: { field, new_value: value },
      });
    }

    toast.success("Permission updated");
  };

  const toggleSystemFreeze = () => {
    const newState = !systemFrozen;
    requireReAuth(async () => {
      const { error } = await supabase.from("platform_settings").upsert({
        key: "system_frozen",
        value: String(newState),
        updated_by: user?.id,
      }, { onConflict: "key" });

      if (error) {
        toast.error("Failed to toggle system freeze");
        return;
      }
      setSystemFrozen(newState);
      toast[newState ? "warning" : "success"](newState ? "🚨 SYSTEM FROZEN — All transactions halted" : "✅ System unfrozen — Transactions resumed");

      if (user) {
        await supabase.from("audit_trail").insert({
          actor_id: user.id,
          actor_role: "manager",
          action: newState ? "system_freeze" : "system_unfreeze",
          target_table: "platform_settings",
          details: { frozen: newState },
        });
      }
    });
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminName || !newAdminPassword) {
      toast.error("Fill all fields");
      return;
    }
    setCreatingAdmin(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: { data: { full_name: newAdminName, role: "admin" } },
      });
      if (error) throw error;
      if (data.user) {
        toast.success(`Admin account created for ${newAdminEmail}. They must verify their email.`);
        if (user) {
          await supabase.from("audit_trail").insert({
            actor_id: user.id,
            actor_role: "manager",
            action: "create_admin",
            target_table: "user_roles",
            target_id: data.user.id,
            details: { email: newAdminEmail, name: newAdminName },
          });
        }
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handlePayoutSubmit = () => {
    const amt = Number(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > 10000) {
      setPayoutConfirmOpen(true);
      return;
    }
    executePayout(amt);
  };

  const executePayout = (amt: number) => {
    requireReAuth(async () => {
      toast.info(`Payout of KES ${amt.toLocaleString()} initiated — connect Daraja API for live payouts`);
      if (user) {
        await supabase.from("audit_trail").insert({
          actor_id: user.id,
          actor_role: "manager",
          action: "platform_payout",
          target_table: "wallets",
          details: { amount: amt },
        });
      }
      setPayoutAmount("");
    });
  };

  // View mode navigation
  const handleViewMode = (mode: "manager" | "rider" | "driver") => {
    setViewMode(mode);
    if (mode === "rider") navigate("/rider");
    else if (mode === "driver") navigate("/driver");
    // manager stays on current page
  };

  const netProfit = totalRevenue - totalFees;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-panel px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <ERideLogo size="sm" />
          <div className="flex items-center gap-2">
            {systemFrozen && (
              <Badge variant="destructive" className="animate-pulse">
                <Snowflake className="w-3 h-3 mr-1" /> FROZEN
              </Badge>
            )}
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" /> Manager
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Manager Vault</h1>
          <p className="text-sm text-muted-foreground mb-4">Absolute platform control. Hidden from all other roles.</p>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <MonitorSmartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-2">Preview as:</span>
            {(["manager", "rider", "driver"] as const).map(mode => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? "default" : "outline"}
                className="text-xs h-7 capitalize"
                onClick={() => handleViewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="vault" className="text-xs"><Lock className="w-3 h-3 mr-1" />Vault</TabsTrigger>
            <TabsTrigger value="admins" className="text-xs"><Users className="w-3 h-3 mr-1" />Admins</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs"><ToggleLeft className="w-3 h-3 mr-1" />Perms</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs"><FileText className="w-3 h-3 mr-1" />Audit</TabsTrigger>
            <TabsTrigger value="overrides" className="text-xs"><Shield className="w-3 h-3 mr-1" />Override</TabsTrigger>
          </TabsList>

          {/* === VAULT (Sensitive Data) === */}
          <TabsContent value="vault" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Gross Volume</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">KES {totalRevenue.toLocaleString()}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">M-Pesa Fees</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold text-destructive">-KES {totalFees.toLocaleString()}</p></CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Net Platform Profit</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-primary">KES {netProfit.toLocaleString()}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Active Wallets</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">{walletCount}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Commission Rate</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">{commission}%</p></CardContent>
              </Card>
            </div>

            <SystemHealth />

            {/* Commission Slider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4" /> Global Commission Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{commission}%</span>
                  {commissionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                <Slider
                  value={[commission]}
                  min={5}
                  max={40}
                  step={1}
                  onValueCommit={(v) => updateCommission(v[0])}
                />
                <p className="text-xs text-muted-foreground">Requires re-authentication to save.</p>
              </CardContent>
            </Card>

            {/* Withdraw Platform Funds */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" /> Withdraw Platform Funds</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="number"
                  placeholder="Amount (KES)"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
                <Button variant="destructive" className="w-full" onClick={handlePayoutSubmit}>
                  Withdraw to M-Pesa (Re-auth required)
                </Button>
                <p className="text-xs text-muted-foreground">Payouts over KES 10,000 require a double-check confirmation.</p>
              </CardContent>
            </Card>

            {/* System Freeze */}
            <Card className={systemFrozen ? "border-destructive" : ""}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Snowflake className="w-4 h-4" /> System Freeze
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {systemFrozen
                    ? "🚨 System is FROZEN. All transactions are halted. Press below to unfreeze."
                    : "Press to freeze all platform transactions in case of a security breach."}
                </p>
                <Button
                  variant={systemFrozen ? "default" : "destructive"}
                  className="w-full"
                  onClick={toggleSystemFreeze}
                >
                  <Snowflake className="w-4 h-4 mr-2" />
                  {systemFrozen ? "Unfreeze System" : "FREEZE ALL TRANSACTIONS"}
                </Button>
              </CardContent>
            </Card>

            {/* M-Pesa API Credentials (Master Switch) */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> M-Pesa API Master Switch</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Daraja API credentials are stored as backend secrets. Only the manager can rotate them.
                </p>
                <Button variant="outline" className="w-full" onClick={() => requireReAuth(() => toast.info("API credential rotation: configure via Lovable Cloud secrets"))}>
                  Rotate Daraja API Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === MANAGE ADMINS === */}
          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create New Admin Account</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Full Name</Label>
                  <Input placeholder="Admin name" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" placeholder="admin@eride.co.ke" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Password</Label>
                  <Input type="password" placeholder="Strong password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateAdmin} disabled={creatingAdmin}>
                  {creatingAdmin ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Admin Account
                </Button>
                <p className="text-xs text-muted-foreground">New admin must verify email before signing in.</p>
              </CardContent>
            </Card>

            {/* Admin List */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Current Admins</CardTitle></CardHeader>
              <CardContent>
                {permLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No admins found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">ID</TableHead>
                        <TableHead className="text-xs">Drivers</TableHead>
                        <TableHead className="text-xs">Revenue</TableHead>
                        <TableHead className="text-xs">Refunds</TableHead>
                        <TableHead className="text-xs">Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map(admin => (
                        <TableRow key={admin.admin_user_id}>
                          <TableCell className="text-xs font-medium">{admin.full_name || "Admin"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{admin.admin_user_id.slice(0, 8)}…</TableCell>
                          <TableCell><Badge variant={admin.can_approve_drivers ? "default" : "secondary"} className="text-[10px]">{admin.can_approve_drivers ? "Yes" : "No"}</Badge></TableCell>
                          <TableCell><Badge variant={admin.can_view_revenue ? "default" : "secondary"} className="text-[10px]">{admin.can_view_revenue ? "Yes" : "No"}</Badge></TableCell>
                          <TableCell><Badge variant={admin.can_issue_refunds ? "default" : "secondary"} className="text-[10px]">{admin.can_issue_refunds ? "Yes" : "No"}</Badge></TableCell>
                          <TableCell><Badge variant={admin.can_delete_users ? "destructive" : "secondary"} className="text-[10px]">{admin.can_delete_users ? "Yes" : "No"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ADMIN PERMISSIONS === */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ToggleLeft className="w-4 h-4" /> Admin Permission Toggles</CardTitle></CardHeader>
              <CardContent>
                {permLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No admins found.</p>
                ) : (
                  <div className="space-y-6">
                    {admins.map(admin => (
                      <div key={admin.admin_user_id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{admin.full_name || "Admin"}</span>
                          <span className="text-xs text-muted-foreground">({admin.admin_user_id.slice(0, 8)}…)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-6">
                          {[
                            { key: "can_approve_drivers", label: "Verify Drivers" },
                            { key: "can_view_revenue", label: "View Revenue" },
                            { key: "can_issue_refunds", label: "Process Refunds" },
                            { key: "can_delete_users", label: "Delete Users" },
                          ].map(perm => (
                            <div key={perm.key} className="flex items-center gap-2">
                              <Switch
                                checked={admin[perm.key as keyof AdminPerm] as boolean}
                                onCheckedChange={(v) => toggleAdminPerm(admin.admin_user_id, perm.key, v)}
                              />
                              <Label className="text-xs">{perm.label}</Label>
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === AUDIT TRAIL === */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" /> System Audit Trail
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => {
                    setAuditLoading(true);
                    supabase.from("audit_trail").select("*").order("created_at", { ascending: false }).limit(100)
                      .then(({ data }) => { setAuditLog((data as AuditEntry[]) ?? []); setAuditLoading(false); });
                  }}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : auditLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No audit entries yet.</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Time</TableHead>
                          <TableHead className="text-xs">Role</TableHead>
                          <TableHead className="text-xs">Action</TableHead>
                          <TableHead className="text-xs">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLog.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{entry.actor_role}</Badge></TableCell>
                            <TableCell className="text-xs">{entry.action}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(entry.details)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === OVERRIDES === */}
          <TabsContent value="overrides" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Undo2 className="w-4 h-4" /> Override Admin Actions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If an admin suspended a user, you can reinstate them here. All overrides are logged in the audit trail.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info("User reinstatement: integrate with user suspension system")}
                >
                  <Ban className="w-4 h-4 mr-2" /> View Suspended Users & Override
                </Button>
              </CardContent>
            </Card>

            {/* Conflict Log */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Conflict Log</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Shows any admin attempts to override manager-level settings.
                </p>
                <ScrollArea className="h-[200px]">
                  {auditLog.filter(e => e.action.includes("override") || e.action.includes("conflict")).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No conflicts detected.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Time</TableHead>
                          <TableHead className="text-xs">Action</TableHead>
                          <TableHead className="text-xs">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLog.filter(e => e.action.includes("override") || e.action.includes("conflict")).map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs">{new Date(entry.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{entry.action}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{JSON.stringify(entry.details)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Re-auth Modal */}
      <ReAuthModal
        open={reAuthOpen}
        onOpenChange={setReAuthOpen}
        onSuccess={handleReAuthSuccess}
        title="Manager Re-authentication"
        description="This sensitive action requires your password."
      />

      {/* Double-Check Payout Modal (KES 10,000+) */}
      <AlertDialog open={payoutConfirmOpen} onOpenChange={setPayoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Large Payout
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to withdraw <strong>KES {Number(payoutAmount).toLocaleString()}</strong>. This exceeds the KES 10,000 threshold and requires double confirmation. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                setPayoutConfirmOpen(false);
                executePayout(Number(payoutAmount));
              }}
            >
              Confirm Payout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
