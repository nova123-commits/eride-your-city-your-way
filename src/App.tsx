import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RiderHome from "./pages/RiderHome";
import DriverHome from "./pages/DriverHome";
import GoldMember from "./pages/GoldMember";
import DriverOnboarding from "./pages/DriverOnboarding";
import AdminOverview from "./pages/AdminOverview";
import AdminApprovals from "./pages/AdminApprovals";
import TaxReport from "./pages/TaxReport";
import WalletPage from "./pages/WalletPage";
import DriveWithUs from "./pages/DriveWithUs";
import Legal from "./pages/Legal";
import HelpCenter from "./pages/HelpCenter";
import SharedTrip from "./pages/SharedTrip";
import DriverDashboard from "./pages/DriverDashboard";
import AdminCommandCenter from "./pages/AdminCommandCenter";
import TripsHistory from "./pages/TripsHistory";
import SafetyCenter from "./pages/SafetyCenter";
import SettingsPage from "./pages/SettingsPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import DriverManual from "./pages/DriverManual";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    console.log("%c[eRide Health Report]", "color:#00c853;font-weight:bold;font-size:14px", {
      timestamp: new Date().toISOString(),
      routes: [
        "/ (Landing)", "/auth", "/rider", "/driver", "/gold", "/onboarding",
        "/admin/overview", "/admin/approvals", "/admin/tax", "/admin/command",
        "/wallet", "/driver/dashboard", "/trips-history", "/safety-center",
        "/settings", "/drive-with-us", "/legal", "/terms", "/help", "/trip/:token",
      ],
      sidebar_links: {
        "My Trips": "/trips-history ✅",
        "Wallet": "/wallet ✅",
        "Payment Methods": "/wallet ✅",
        "Safety Toolkit": "/safety-center ✅",
        "Rewards": "/gold ✅",
        "Help": "/help ✅",
        "Settings": "/settings ✅",
      },
      sidebar_on_pages: ["/rider ✅", "/driver ✅", "/wallet ✅", "/settings ✅"],
      wallet: {
        canWithdraw_logic: "balance >= 500 + TRANSACTION_FEE (515) ✅",
        deposit_flow: "STK Push modal → 5s wait → DB update → auto-close ✅",
        realtime_balance: "Sidebar + WalletPage both subscribe to wallets table ✅",
      },
      admin_protection: "ProtectedRoute with allowedRoles=['admin'] ✅",
      role_switch: "RiderSidebar shows 'Switch to Rider Mode' for drivers ✅",
      referral: "Unique per-user code generated from user.id substring ✅",
    });
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/rider" element={<ProtectedRoute allowedRoles={["rider"]}><RiderHome /></ProtectedRoute>} />
            <Route path="/driver" element={<ProtectedRoute allowedRoles={["driver"]}><DriverHome /></ProtectedRoute>} />
            <Route path="/gold" element={<ProtectedRoute><GoldMember /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["driver"]}><DriverOnboarding /></ProtectedRoute>} />
            <Route path="/admin/overview" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApprovals /></ProtectedRoute>} />
            <Route path="/admin/tax" element={<ProtectedRoute allowedRoles={["admin"]}><TaxReport /></ProtectedRoute>} />
            <Route path="/admin/command" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommandCenter /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={["driver"]}><DriverDashboard /></ProtectedRoute>} />
            <Route path="/trips-history" element={<ProtectedRoute><TripsHistory /></ProtectedRoute>} />
            <Route path="/safety-center" element={<ProtectedRoute><SafetyCenter /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/drive-with-us" element={<DriveWithUs />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
            <Route path="/trip/:token" element={<SharedTrip />} />
            <Route path="/manager" element={<ProtectedRoute allowedRoles={["manager"]}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
