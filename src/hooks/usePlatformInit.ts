import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformInit(enabled = true) {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setLoading(false);
      setInitialized(null);
      return () => {
        cancelled = true;
      };
    }

    const check = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "platform_initialized")
          .single();

        if (error) {
          console.warn("[eRide Platform] Platform init check failed:", error.message);
          if (!cancelled) setInitialized(null);
          return;
        }

        if (!cancelled) {
          setInitialized(data?.value === "true");
        }
      } catch (error) {
        console.error("[eRide Platform] Unexpected platform init error:", error);
        if (!cancelled) setInitialized(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const markInitialized = async () => {
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "platform_initialized", value: "true" }, { onConflict: "key" });

    if (error) {
      console.error("[eRide Platform] Failed to mark platform initialized:", error.message);
      throw error;
    }

    setInitialized(true);
  };

  return { initialized, loading, markInitialized };
}
