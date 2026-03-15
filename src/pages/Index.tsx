import React from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Bike, MessageCircle } from 'lucide-react';
import ERideLogo from '@/components/ERideLogo';
import { useAuth } from '@/hooks/useAuth';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, loading, roleLoading } = useAuth();

  // Show nothing while loading — prevents flash redirects
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Authenticated with role → go to role home
  if (user && role) {
    if (role === "driver") return <Navigate to="/driver" replace />;
    if (role === "rider") return <Navigate to="/rider" replace />;
    if (role === "manager" || role === "super_admin") return <Navigate to="/manager" replace />;
    if (["admin", "operations_manager", "support_agent", "finance"].includes(role)) {
      return <Navigate to="/admin/overview" replace />;
    }
    return <Navigate to="/rider" replace />;
  }

  // Authenticated without role → onboarding
  if (user && !role) {
    return <Navigate to="/onboarding" replace />;
  }

  // Not authenticated → show landing
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <ERideLogo size="lg" />
        <p className="text-muted-foreground mt-3 text-sm">Your ride, your way</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          onClick={() => navigate('/auth')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98] group"
        >
          <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-foreground text-lg">I need a ride</h2>
            <p className="text-sm text-muted-foreground">Book a ride to your destination</p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          onClick={() => navigate('/auth')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Bike className="w-7 h-7 text-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-foreground text-lg">I'm a driver</h2>
            <p className="text-sm text-muted-foreground">Go online and accept rides</p>
          </div>
        </motion.button>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 text-xs text-muted-foreground">
        Basic · Xtra · Boda — rides for everyone
      </motion.p>

      <motion.a
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        href="https://wa.me/254700000000?text=Hi%20eRide%20Support" target="_blank" rel="noopener noreferrer"
        className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <MessageCircle className="w-3.5 h-3.5" /> Contact Support
      </motion.a>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 mb-6 text-center max-w-sm">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          eRide is a registered Transport Network Company (TNC) in Kenya. Compliant with NTSA 2026 Regulations.
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 text-[10px]">
          <Link to="/legal" className="text-primary hover:underline">Terms</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/legal" className="text-primary hover:underline">Privacy</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/drive-with-us" className="text-primary hover:underline">Drive with us</Link>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;
