import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Award } from 'lucide-react';

const RATING_TREND = [
  { week: 'Week 1', avg: 4.6, fiveStars: 18 },
  { week: 'Week 2', avg: 4.7, fiveStars: 22 },
  { week: 'Week 3', avg: 4.8, fiveStars: 28 },
  { week: 'This Week', avg: 4.9, fiveStars: 5 },
];

const PerformanceFeedback: React.FC = () => {
  const currentWeek = RATING_TREND[RATING_TREND.length - 1];
  const previousWeek = RATING_TREND[RATING_TREND.length - 2];
  const ratingUp = currentWeek.avg >= previousWeek.avg;

  return (
    <div className="space-y-3">
      {/* Rating highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="brand-gradient rounded-xl p-4 text-primary-foreground"
      >
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5" />
          <span className="text-sm font-semibold">Performance Feedback</span>
        </div>
        <p className="text-2xl font-bold flex items-center gap-1">
          {currentWeek.avg}
          <Star className="w-5 h-5 fill-current" />
        </p>
        <p className="text-xs opacity-80 mt-1">
          🎉 You received {currentWeek.fiveStars} five-star ratings this week!
        </p>
      </motion.div>

      {/* Rating trend */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          Rating Trends
        </h4>
        <div className="space-y-2">
          {RATING_TREND.map((week, i) => (
            <div key={week.week} className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-16">{week.week}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(week.avg / 5) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="h-full brand-gradient rounded-full"
                />
              </div>
              <div className="flex items-center gap-1 w-12">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-bold text-foreground">{week.avg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Positive indicator */}
      {ratingUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-2 rounded-lg bg-accent text-accent-foreground text-xs"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Your ratings are trending up! Keep it going 🚀
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceFeedback;
