import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Month = Database["public"]["Tables"]["months"]["Row"];

export interface UseMonthsResult {
  months: Month[];
  memberCount: number;
  householdId: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMonths(): UseMonthsResult {
  const [months, setMonths] = useState<Month[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: monthData, error: monthErr } = await supabase
        .from("months")
        .select("*")
        .order("year", { ascending: true })
        .order("month_num", { ascending: true });

      if (cancelled) return;

      if (monthErr) {
        setError(monthErr.message);
        setLoading(false);
        return;
      }

      setMonths(monthData ?? []);

      let hid: string | null = monthData?.[0]?.household_id ?? null;

      if (!hid) {
        const { data: memberData } = await supabase
          .from("household_members")
          .select("household_id")
          .limit(1)
          .maybeSingle();
        if (!cancelled) hid = memberData?.household_id ?? null;
      }

      if (!cancelled) setHouseholdId(hid);

      if (hid) {
        const { count } = await supabase
          .from("household_members")
          .select("*", { count: "exact", head: true })
          .eq("household_id", hid);
        if (!cancelled) setMemberCount(count ?? 0);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { months, memberCount, householdId, loading, error, refresh };
}
