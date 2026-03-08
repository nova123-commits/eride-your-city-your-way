import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle2, XCircle, Clock, FileText, Car, GraduationCap, User
} from "lucide-react";

interface DriverApplication {
  id: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  documents: { name: string; expiry: string }[];
  vehicleChecks: { label: string; passed: boolean }[];
  quizScore: string;
}

export default function AdminApprovals() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("eride_driver_applications") || "[]");
    setApplications(stored);
  }, []);

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    const updated = applications.map((a) => a.id === id ? { ...a, status } : a);
    setApplications(updated);
    localStorage.setItem("eride_driver_applications", JSON.stringify(updated));
    toast({
      title: status === "approved" ? "Driver Approved ✓" : "Driver Rejected",
      description: status === "approved"
        ? "A Verified badge has been added to their profile."
        : "The driver has been notified of the rejection.",
    });
  };

  const pending = applications.filter((a) => a.status === "pending");
  const resolved = applications.filter((a) => a.status !== "pending");

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
            <Shield className="w-3 h-3 mr-1" /> Admin Panel
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Driver Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage driver onboarding applications.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", count: pending.length, icon: Clock, color: "text-yellow-500" },
            { label: "Approved", count: applications.filter((a) => a.status === "approved").length, icon: CheckCircle2, color: "text-primary" },
            { label: "Rejected", count: applications.filter((a) => a.status === "rejected").length, icon: XCircle, color: "text-destructive" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Applications */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" /> Pending Review ({pending.length})
            </h2>
            {pending.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ApplicationCard app={app} onApprove={() => updateStatus(app.id, "approved")} onReject={() => updateStatus(app.id, "rejected")} />
              </motion.div>
            ))}
          </div>
        )}

        {pending.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending applications. All caught up!</p>
            </CardContent>
          </Card>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">History</h2>
            {resolved.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, onApprove, onReject }: { app: DriverApplication; onApprove?: () => void; onReject?: () => void }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Driver #{app.id.slice(0, 8)}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(app.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={
            app.status === "approved" ? "bg-primary/15 text-primary" :
            app.status === "rejected" ? "bg-destructive/15 text-destructive" :
            "bg-yellow-500/15 text-yellow-600"
          }>
            {app.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {app.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-muted/50">
            <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">{app.documents.length} Docs</p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <Car className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">{app.vehicleChecks.filter((c) => c.passed).length}/{app.vehicleChecks.length} Checks</p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <GraduationCap className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">{app.quizScore}</p>
          </div>
        </div>

        {app.status === "pending" && onApprove && onReject && (
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onReject}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" className="flex-1" onClick={onApprove}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
