import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/wallet" element={<ProtectedRoute allowedRoles={["driver"]}><WalletPage /></ProtectedRoute>} />
            <Route path="/drive-with-us" element={<DriveWithUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
