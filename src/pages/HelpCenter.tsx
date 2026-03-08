import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ERideLogo from "@/components/ERideLogo";
import RoleNav from "@/components/RoleNav";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle, MessageSquare, Search, Package, DollarSign, Shield, User,
  ChevronRight, ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import SupportChat from "@/components/support/SupportChat";
import LostItemForm from "@/components/support/LostItemForm";

const riderCategories = [
  { icon: Package, label: "Lost Items", description: "Report or track a lost item", key: "lost" },
  { icon: DollarSign, label: "Fare Disputes", description: "Challenge an incorrect fare", key: "fare" },
  { icon: User, label: "Account", description: "Profile, payments & settings", key: "account" },
  { icon: Shield, label: "Safety", description: "Report safety concerns", key: "safety" },
];

const driverCategories = [
  { icon: DollarSign, label: "Account & Payouts", description: "Earnings, withdrawals & tax", key: "payouts" },
  { icon: Package, label: "Lost Items", description: "Rider reported a lost item", key: "lost" },
  { icon: Shield, label: "Safety", description: "Incident reporting & support", key: "safety" },
  { icon: HelpCircle, label: "Vehicle & NTSA", description: "Compliance & vehicle issues", key: "vehicle" },
];

const faqItems = [
  { q: "How do I pay for a ride?", a: "eRide accepts M-Pesa, card payments, and cash. Select your preferred method before booking." },
  { q: "How do I report a lost item?", a: "Go to your Trip History, find the trip, and tap 'Report Lost Item'. We'll notify the driver immediately." },
  { q: "How are fares calculated?", a: "Fares are based on distance, time, demand, and ride category (Basic, Xtra, or Boda)." },
  { q: "How do I become a driver?", a: "Tap 'Drive with us' on the home screen. You'll need a valid license, NTSA compliance certificate, and pass our verification." },
];

export default function HelpCenter() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showLostItem, setShowLostItem] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = faqItems.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  if (showChat) {
    return <SupportChat onBack={() => setShowChat(false)} />;
  }

  if (showLostItem) {
    return <LostItemForm onBack={() => setShowLostItem(false)} />;
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom pb-24">
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <ERideLogo size="sm" />
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">How can we help you today?</p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* AI Chat CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card
            className="border-primary/20 bg-accent/30 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setShowChat(true)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Chat with eRide Assistant</h3>
                <p className="text-xs text-muted-foreground">Get instant answers powered by AI</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories */}
        <Tabs defaultValue={role === "driver" ? "driver" : "rider"}>
          <TabsList className="w-full">
            <TabsTrigger value="rider" className="flex-1">Rider Help</TabsTrigger>
            <TabsTrigger value="driver" className="flex-1">Driver Help</TabsTrigger>
          </TabsList>

          <TabsContent value="rider" className="space-y-3 mt-4">
            {riderCategories.map((cat, i) => (
              <motion.div key={cat.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    if (cat.key === "lost") setShowLostItem(true);
                    else setShowChat(true);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <cat.icon className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="driver" className="space-y-3 mt-4">
            {driverCategories.map((cat, i) => (
              <motion.div key={cat.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    if (cat.key === "lost") setShowLostItem(true);
                    else setShowChat(true);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <cat.icon className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <Card
                key={i}
                className="cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{faq.q}</p>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFaq === i ? "rotate-90" : ""}`}
                    />
                  </div>
                  {expandedFaq === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground mt-2"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* WhatsApp fallback */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground mb-2">Still need help?</p>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://wa.me/254700000000?text=Hi%20eRide%20Support"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              WhatsApp Support
            </a>
          </Button>
        </div>
      </div>

      <RoleNav />
    </div>
  );
}
