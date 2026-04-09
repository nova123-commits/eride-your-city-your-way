import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Gift, Coins, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// 100 KES = 1 point, 100 points = 50 KES discount
const KES_PER_POINT = 100;
const POINTS_FOR_REWARD = 100;
const REWARD_DISCOUNT_KES = 50;

interface LoyaltyRewardsProps {
  totalSpentKES?: number;
}

const LoyaltyRewards: React.FC<LoyaltyRewardsProps> = ({ totalSpentKES = 0 }) => {
  const { toast } = useToast();

  // Load from localStorage for persistence
  const [pointsData, setPointsData] = useState(() => {
    const stored = localStorage.getItem('eride_loyalty_points');
    if (stored) return JSON.parse(stored);
    return { totalPoints: 0, redeemedPoints: 0, totalSpent: 0 };
  });

  const availablePoints = pointsData.totalPoints - pointsData.redeemedPoints;
  const canRedeem = availablePoints >= POINTS_FOR_REWARD;
  const pointsToNext = POINTS_FOR_REWARD - (availablePoints % POINTS_FOR_REWARD);
  const progressPercent = ((availablePoints % POINTS_FOR_REWARD) / POINTS_FOR_REWARD) * 100;

  // Simulate earning points from rides
  useEffect(() => {
    if (totalSpentKES > pointsData.totalSpent) {
      const newPoints = Math.floor((totalSpentKES - pointsData.totalSpent) / KES_PER_POINT);
      if (newPoints > 0) {
        const updated = {
          ...pointsData,
          totalPoints: pointsData.totalPoints + newPoints,
          totalSpent: totalSpentKES,
        };
        setPointsData(updated);
        localStorage.setItem('eride_loyalty_points', JSON.stringify(updated));
        toast({ title: `+${newPoints} eRide Points earned!`, description: `Spend 100 points for KES 50 off.` });
      }
    }
  }, [totalSpentKES]);

  const handleRedeem = () => {
    if (!canRedeem) return;
    const updated = {
      ...pointsData,
      redeemedPoints: pointsData.redeemedPoints + POINTS_FOR_REWARD,
    };
    setPointsData(updated);
    localStorage.setItem('eride_loyalty_points', JSON.stringify(updated));
    toast({
      title: 'Reward Redeemed! 🎉',
      description: `KES ${REWARD_DISCOUNT_KES} discount applied to your next ride.`,
    });
  };



  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">eRide Rewards</p>
                <p className="text-[10px] text-muted-foreground">Earn points on every ride</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Coins className="w-3 h-3" /> {availablePoints} pts
            </Badge>
          </div>

          {/* Points summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-secondary text-center">
              <p className="text-sm font-bold text-foreground">{pointsData.totalPoints}</p>
              <p className="text-[9px] text-muted-foreground">Total Earned</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary text-center">
              <p className="text-sm font-bold text-foreground">{pointsData.redeemedPoints}</p>
              <p className="text-[9px] text-muted-foreground">Redeemed</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary text-center">
              <p className="text-sm font-bold text-primary">{availablePoints}</p>
              <p className="text-[9px] text-muted-foreground">Available</p>
            </div>
          </div>

          {/* Progress to next reward */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Next reward
              </span>
              <span className="text-[10px] font-medium text-foreground">
                {canRedeem ? 'Ready!' : `${pointsToNext} pts to go`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${canRedeem ? 100 : progressPercent}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          {/* How it works */}
          <div className="p-2 rounded-lg bg-muted/50 text-[10px] text-muted-foreground space-y-0.5">
            <p>• Every KES 100 spent = 1 eRide Point</p>
            <p>• 100 Points = KES 50 discount on next ride</p>
          </div>

          <Button
            size="sm"
            className="w-full text-xs gap-1"
            onClick={handleRedeem}
            disabled={!canRedeem}
          >
            <Star className="w-3.5 h-3.5" />
            {canRedeem ? `Redeem KES ${REWARD_DISCOUNT_KES}` : 'Not enough pts'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoyaltyRewards;
