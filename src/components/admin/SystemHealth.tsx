import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, TrendingDown, TrendingUp } from 'lucide-react';

export default function SystemHealth() {
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [belowThreshold, setBelowThreshold] = useState(0);
  const [totalCancels, setTotalCancels] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('driver_commitment_scores')
        .select('score,total_cancels');

      if (data?.length) {
        const scores = data.map((d: any) => d.score as number);
        const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        setAvgScore(Math.round(avg));
        setTotalDrivers(scores.length);
        setBelowThreshold(scores.filter((s: number) => s < 70).length);
        setTotalCancels(data.reduce((a: number, d: any) => a + (d.total_cancels as number), 0));
      }
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> System Health — Driver Commitment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Score</p>
            <p className={`text-2xl font-bold ${(avgScore ?? 100) >= 70 ? 'text-primary' : 'text-destructive'}`}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Tracked</p>
            <p className="text-2xl font-bold text-foreground">{totalDrivers}</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3 text-destructive" /> Below 70%</p>
            <p className="text-2xl font-bold text-destructive">{belowThreshold}</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Total Cancels</p>
            <p className="text-2xl font-bold text-foreground">{totalCancels}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
