import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CurrencyCode } from '@/lib/currency';

interface FareLock {
  id: string;
  fare_amount: number;
  category_id: string;
  pickup: string;
  destination: string;
  currency: string;
  distance_km: number;
}

export function useFareLock() {
  const { user } = useAuth();
  const lockRef = useRef<FareLock | null>(null);

  const lockFare = useCallback(async (params: {
    categoryId: string;
    pickup: string;
    destination: string;
    fareAmount: number;
    currency: CurrencyCode;
    distanceKm: number;
  }) => {
    if (!user) return null;

    // Deactivate any existing locks
    await (supabase as any)
      .from('locked_fares')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data, error } = await (supabase as any)
      .from('locked_fares')
      .insert({
        user_id: user.id,
        category_id: params.categoryId,
        pickup: params.pickup,
        destination: params.destination,
        fare_amount: params.fareAmount,
        currency: params.currency,
        distance_km: params.distanceKm,
      })
      .select()
      .single();

    if (!error && data) {
      lockRef.current = data as FareLock;
      return data as FareLock;
    }
    return null;
  }, [user]);

  const getLockedFare = useCallback(() => lockRef.current?.fare_amount ?? null, []);

  const releaseLock = useCallback(async () => {
    if (!user || !lockRef.current) return;
    await (supabase as any)
      .from('locked_fares')
      .update({ is_active: false })
      .eq('id', lockRef.current.id);
    lockRef.current = null;
  }, [user]);

  return { lockFare, getLockedFare, releaseLock, currentLock: lockRef };
}
