import { useState } from "react";
import { motion } from "framer-motion";
import ERideLogo from "@/components/ERideLogo";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Flame, Send, Zap, Ban, DollarSign } from "lucide-react";
import DemandHeatmap from "@/components/admin/DemandHeatmap";
import ManualDispatch from "@/components/admin/ManualDispatch";
import SurgeControl from "@/components/admin/SurgeControl";
import UserSuspension from "@/components/admin/UserSuspension";
import FinancialReconciliation from "@/components/admin/FinancialReconciliation";

const TABS = [
  { value: "heatmap", label: "Heatmap", icon: Flame },
  { value: "dispatch", label: "Dispatch", icon: Send },
  { value: "surge", label: "Surge", icon: Zap },
  { value: "users", label: "Users", icon: Ban },
  { value: "finance", label: "Finance", icon: DollarSign },
];

export default function AdminCommandCenter() {
  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
            <Shield className="w-3 h-3 mr-1" /> Command Center
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Advanced platform operations & analytics.</p>
        </motion.div>

        <Tabs defaultValue="heatmap" className="mt-6">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center gap-1 py-2 text-[11px]">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="heatmap"><DemandHeatmap /></TabsContent>
            <TabsContent value="dispatch"><ManualDispatch /></TabsContent>
            <TabsContent value="surge"><SurgeControl /></TabsContent>
            <TabsContent value="users"><UserSuspension /></TabsContent>
            <TabsContent value="finance"><FinancialReconciliation /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
