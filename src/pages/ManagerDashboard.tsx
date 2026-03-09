import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ERideLogo from "@/components/ERideLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReAuthModal from "@/components/ReAuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Crown, Shield, Eye, Users, DollarSign, FileText, ToggleLeft,
  ArrowDownCircle, Percent, Loader2, RefreshCw, UserCheck, Ban, Undo2
} from "lucide-react";

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
  const [tab, setTab] = useState("overview");
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Overview state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [commission, setCommission] = useState(15);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [walletCount, setWalletCount] = useState(0);

  // Permissions state
  const [admins, setAdmins] = useState<AdminPerm[]>([]);
  const [permLoading, setPermLoading] = useState(true);

  // Audit state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  // Suspended users
  const [suspendedOverrides, setSuspendedOverrides] = useState<Array<{ id: string; full_name: string | null }>>([]);

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
        supabase.from("platform_settings").select("key,value").in("key", ["global_commission"]),
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

      // Merge: create missing permission rows for admins
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
        // Log audit
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

  const netProfit = totalRevenue - totalFees;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-panel px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <ERideLogo size="sm" />
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Crown className="w-3 h-3 mr-1" /> Manager
          </Badge>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Manager Vault</h1>
          <p className="text-sm text-muted-foreground mb-6">Absolute platform control. Hidden from all other roles.</p>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="overview" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Profit</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs"><ToggleLeft className="w-3 h-3 mr-1" />Perms</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs"><FileText className="w-3 h-3 mr-1" />Audit</TabsTrigger>
            <TabsTrigger value="overrides" className="text-xs"><Shield className="w-3 h-3 mr-1" />Override</TabsTrigger>
          </TabsList>

          {/* === PROFIT OVERVIEW === */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Volume</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">KES {totalRevenue.toLocaleString()}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">M-Pesa Fees</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold text-destructive">-KES {totalFees.toLocaleString()}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Net Profit</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold text-primary">KES {netProfit.toLocaleString()}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Active Wallets</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">{walletCount}</p></CardContent>
              </Card>
            </div>

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

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" /> Withdraw Platform Funds</CardTitle></CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => requireReAuth(() => toast.info("Withdrawal initiated — connect Daraja API for live payouts"))}
                >
                  Withdraw to M-Pesa (Re-auth required)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ADMIN PERMISSIONS === */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Admin Permission Toggles</CardTitle></CardHeader>
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
                            { key: "can_approve_drivers", label: "Approve Drivers" },
                            { key: "can_view_revenue", label: "View Revenue" },
                            { key: "can_issue_refunds", label: "Issue Refunds" },
                            { key: "can_delete_users", label: "Delete Users" },
                          ].map(perm => (
                            <div key={perm.key} className="flex items-center gap-2">
                              <Switch
                                checked={(admin as Record<string, unknown>)[perm.key] as boolean}
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
                  <Eye className="w-4 h-4" /> Audit Trail
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
                  If an admin suspended a user, you can reinstate them here. Overrides are logged in the audit trail.
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
          </TabsContent>
        </Tabs>
      </div>

      <ReAuthModal
        open={reAuthOpen}
        onOpenChange={setReAuthOpen}
        onSuccess={handleReAuthSuccess}
        title="Manager Re-authentication"
        description="This sensitive action requires your password."
      />
    </div>
  );
}
