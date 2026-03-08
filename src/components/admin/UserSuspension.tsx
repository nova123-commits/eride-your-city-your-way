import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Search, User, Car, Shield } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  suspended: boolean;
}

export default function UserSuspension() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set(
    JSON.parse(localStorage.getItem("eride_suspended_users") || "[]")
  ));

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
        <h2 className="text-lg font-bold text-foreground">User Suspension</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading users...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <Card key={user.id} className={`border-border/60 ${user.suspended ? "opacity-60 border-destructive/30" : ""}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.full_name || "Unnamed"}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                        {roleIcon(user.role)} {user.role}
                      </Badge>
                      {user.suspended && (
                        <Badge className="text-[10px] bg-destructive/15 text-destructive px-1.5 py-0">Suspended</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={user.suspended ? "outline" : "destructive"}
                  className="text-xs"
                  onClick={() => toggleSuspend(user.id)}
                  disabled={user.role === "admin"}
                >
                  {user.suspended ? "Reinstate" : "Suspend"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
