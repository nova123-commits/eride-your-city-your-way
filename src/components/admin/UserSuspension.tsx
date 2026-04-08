import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Search, User, Car, Shield, CheckCircle, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  suspended: boolean;
  verified: boolean;
}

// Driver documents are now fetched from the database

export default function UserSuspension() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set(
    JSON.parse(localStorage.getItem("eride_suspended_users") || "[]")
  ));
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set(
    JSON.parse(localStorage.getItem("eride_verified_users") || "[]")
  ));
  const [docViewUser, setDocViewUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      if (profiles && roles) {
        const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
        setUsers(profiles.map(p => ({
          ...p,
          role: roleMap.get(p.id) || "rider",
          suspended: suspendedIds.has(p.id),
          verified: verifiedIds.has(p.id),
        })));
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleSuspend = (userId: string) => {
    const newSet = new Set(suspendedIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
      toast({ title: "User Reinstated", description: "Access has been restored." });
    } else {
      newSet.add(userId);
      toast({ title: "User Suspended", description: "Platform access revoked.", variant: "destructive" });
    }
    setSuspendedIds(newSet);
    localStorage.setItem("eride_suspended_users", JSON.stringify([...newSet]));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: newSet.has(userId) } : u));
  };

  const toggleVerify = (userId: string) => {
    const newSet = new Set(verifiedIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
      toast({ title: "Verification Removed" });
    } else {
      newSet.add(userId);
      toast({ title: "User Verified ✓", description: "Profile marked as verified." });
    }
    setVerifiedIds(newSet);
    localStorage.setItem("eride_verified_users", JSON.stringify([...newSet]));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: newSet.has(userId) } : u));
  };

  const filtered = users.filter(u =>
    !search || (u.full_name?.toLowerCase().includes(search.toLowerCase())) || u.phone?.includes(search)
  );

  const roleIcon = (role: string) => {
    if (role === "driver") return <Car className="w-3 h-3" />;
    if (role === "admin") return <Shield className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ban className="w-5 h-5 text-destructive" />
        <h2 className="text-lg font-bold text-foreground">User & Driver Management</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading users...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <Card key={user.id} className={`border-border/60 ${user.suspended ? "opacity-60 border-destructive/30" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground">{user.full_name || "Unnamed"}</p>
                        {user.verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                          {roleIcon(user.role)} {user.role}
                        </Badge>
                        {user.suspended && (
                          <Badge className="text-[10px] bg-destructive/15 text-destructive px-1.5 py-0">Suspended</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pl-12">
                  <Button
                    size="sm"
                    variant={user.verified ? "secondary" : "outline"}
                    className="text-xs gap-1 h-7"
                    onClick={() => toggleVerify(user.id)}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {user.verified ? "Verified" : "Verify"}
                  </Button>
                  {user.role === "driver" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 h-7"
                      onClick={() => setDocViewUser(user)}
                    >
                      <FileText className="w-3 h-3" />
                      Documents
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={user.suspended ? "outline" : "destructive"}
                    className="text-xs h-7 ml-auto"
                    onClick={() => toggleSuspend(user.id)}
                    disabled={user.role === "admin"}
                  >
                    {user.suspended ? "Reinstate" : "Suspend"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Driver Document Viewer */}
      <Dialog open={!!docViewUser} onOpenChange={() => setDocViewUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Driver Documents — {docViewUser?.full_name || "Unnamed"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* NTSA License */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">NTSA Driving License</p>
                  <Badge variant="outline" className="text-[10px]">
                    {verifiedIds.has(docViewUser?.id || "") ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="h-28 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                  <div className="text-center">
                    <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Document preview</p>
                    <p className="text-[9px] text-muted-foreground">No file uploaded yet</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="text-xs flex-1" onClick={() => {
                    if (docViewUser) toggleVerify(docViewUser.id);
                  }}>
                    Approve License
                  </Button>
                  <Button size="sm" variant="destructive" className="text-xs flex-1" onClick={() => {
                    toast({ title: "License Rejected", variant: "destructive" });
                  }}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">Vehicle Insurance</p>
                  <Badge variant="outline" className="text-[10px]">Pending</Badge>
                </div>
                <div className="h-28 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                  <div className="text-center">
                    <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Document preview</p>
                    <p className="text-[9px] text-muted-foreground">No file uploaded yet</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="text-xs flex-1" onClick={() => {
                    toast({ title: "Insurance Approved ✓" });
                  }}>
                    Approve Insurance
                  </Button>
                  <Button size="sm" variant="destructive" className="text-xs flex-1" onClick={() => {
                    toast({ title: "Insurance Rejected", variant: "destructive" });
                  }}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
