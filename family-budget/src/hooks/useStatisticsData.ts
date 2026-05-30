import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { StatsExpense, StatsSource } from "@/budget-engine/statistics";

export interface UseStatisticsDataResult {
  expenses: StatsExpense[];
  sources: StatsSource[];
  loading: boolean;
  error: string | null;
}

export function useStatisticsData(monthId: string | null): UseStatisticsDataResult {
  const [expenses, setExpenses] = useState<StatsExpense[]>([]);
  const [sources, setSources] = useState<StatsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!monthId) {
      setExpenses([]);
      setSources([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [expResult, srcResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("amount, category, tag")
          .eq("month_id", monthId!),
        supabase
          .from("sources")
          .select("balance")
          .eq("month_id", monthId!),
      ]);

      if (cancelled) return;

      if (expResult.error) {
        setError(expResult.error.message);
        setLoading(false);
        return;
      }

      if (srcResult.error) {
        setError(srcResult.error.message);
        setLoading(false);
        return;
      }

      setExpenses(expResult.data ?? []);
      setSources(srcResult.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [monthId]);

  return { expenses, sources, loading, error };
}
