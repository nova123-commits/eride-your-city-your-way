import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { usePlatformInit } from "@/hooks/usePlatformInit";
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
import ManagerSetup from "./pages/ManagerSetup";
import DriverManual from "./pages/DriverManual";
import PlatformSetup from "./pages/PlatformSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Gate that redirects super admins to /admin/platform-setup if platform isn't initialized */
function PlatformInitGate({ children }: { children: React.ReactNode }) {
  const { user, role, loading, roleLoading } = useAuth();
  const { initialized, loading: initLoading } = usePlatformInit();
  const location = useLocation();

  // Don't gate these paths
  const bypassPaths = ["/admin/platform-setup", "/auth", "/", "/drive-with-us", "/legal", "/terms", "/help"];
  if (bypassPaths.some(p => location.pathname === p) || location.pathname.startsWith("/trip/")) {
    return <>{children}</>;
  }

  // Wait for everything to load
  if (loading || roleLoading || initLoading) return null;

  // If platform not initialized and user is a manager/admin, redirect to setup
  if (initialized === false && user && (role === "manager" || role === "admin")) {
    return <Navigate to="/admin/platform-setup" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    console.log("%c[eRide Health Report]", "color:#00c853;font-weight:bold;font-size:14px", {
      timestamp: new Date().toISOString(),
      version: "2.0 — Platform Setup Wizard",
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
          <PlatformInitGate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/rider" element={<ProtectedRoute allowedRoles={["rider"]}><RiderHome /></ProtectedRoute>} />
              <Route path="/driver" element={<ProtectedRoute allowedRoles={["driver"]}><DriverHome /></ProtectedRoute>} />
              <Route path="/gold" element={<ProtectedRoute><GoldMember /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["driver"]} allowNoRole><DriverOnboarding /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><Navigate to="/admin/overview" replace /></ProtectedRoute>} />
              <Route path="/admin/overview" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><AdminOverview /></ProtectedRoute>} />
              <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><AdminApprovals /></ProtectedRoute>} />
              <Route path="/admin/tax" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><TaxReport /></ProtectedRoute>} />
              <Route path="/admin/command" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><AdminCommandCenter /></ProtectedRoute>} />
              <Route path="/admin/platform-setup" element={<ProtectedRoute allowedRoles={["admin", "manager", "super_admin"]}><PlatformSetup /></ProtectedRoute>} />
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
              <Route path="/manager" element={<ProtectedRoute allowedRoles={["manager", "super_admin"]}><ManagerDashboard /></ProtectedRoute>} />
              <Route path="/manager/setup" element={<ProtectedRoute allowedRoles={["manager", "super_admin"]}><ManagerSetup /></ProtectedRoute>} />
              <Route path="/driver/manual" element={<ProtectedRoute allowedRoles={["driver"]}><DriverManual /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PlatformInitGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
