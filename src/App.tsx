import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RiderHome from "./pages/RiderHome";
import DriverHome from "./pages/DriverHome";
import GoldMember from "./pages/GoldMember";
import DriverOnboarding from "./pages/DriverOnboarding";
import AdminApprovals from "./pages/AdminApprovals";
import TaxReport from "./pages/TaxReport";
import WalletPage from "./pages/WalletPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rider" element={<RiderHome />} />
          <Route path="/driver" element={<DriverHome />} />
          <Route path="/gold" element={<GoldMember />} />
          <Route path="/onboarding" element={<DriverOnboarding />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/tax" element={<TaxReport />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
