import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Activity, Wallet, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERideLogo from '@/components/ERideLogo';
import EarningsDashboard from '@/components/driver/EarningsDashboard';
import DriverMetrics from '@/components/driver/DriverMetrics';
import AutoAcceptToggle from '@/components/driver/AutoAcceptToggle';
import PayoutHistory from '@/components/driver/PayoutHistory';
import PerformanceFeedback from '@/components/driver/PerformanceFeedback';
import RoleNav from '@/components/RoleNav';

type Tab = 'earnings' | 'metrics' | 'payouts' | 'performance';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'earnings', label: 'Earnings', icon: BarChart3 },
  { id: 'metrics', label: 'Metrics', icon: Activity },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'performance', label: 'Ratings', icon: Star },
];

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('earnings');

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate('/driver')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center btn-press">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <ERideLogo size="sm" />
          <div className="w-9" />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-background border-b border-border">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-5 pb-24">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <EarningsDashboard />
              <AutoAcceptToggle />
            </div>
          )}
          {activeTab === 'metrics' && <DriverMetrics />}
          {activeTab === 'payouts' && <PayoutHistory />}
          {activeTab === 'performance' && <PerformanceFeedback />}
        </motion.div>
      </div>

      <RoleNav />
    </div>
  );
}
