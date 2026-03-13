import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformInit() {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "platform_initialized")
        .single();
      setInitialized(data?.value === "true");
      setLoading(false);
    };
    check();
  }, []);

  const markInitialized = async () => {
    await supabase
      .from("platform_settings")
      .upsert({ key: "platform_initialized", value: "true" }, { onConflict: "key" });
    setInitialized(true);
  };

  return { initialized, loading, markInitialized };
}
