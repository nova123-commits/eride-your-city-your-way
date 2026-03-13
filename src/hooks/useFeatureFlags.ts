import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  flag_key: string;
  flag_label: string;
  enabled: boolean;
  description: string;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("feature_flags").select("flag_key,enabled");
      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach((f: { flag_key: string; enabled: boolean }) => {
          map[f.flag_key] = f.enabled;
        });
        setFlags(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isEnabled = (key: string) => flags[key] ?? false;

  return { flags, loading, isEnabled };
}
