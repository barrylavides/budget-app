import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type SourceRow = Database["public"]["Tables"]["sources"]["Row"];

export interface UseExpensesResult {
  expenses: ExpenseRow[];
  sources: SourceRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExpenses(monthId: string | null): UseExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!monthId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const [expResult, srcResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("*")
          .eq("month_id", monthId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("sources")
          .select("*")
          .eq("month_id", monthId!)
          .order("name", { ascending: true }),
      ]);

      if (cancelled) return;

      if (expResult.error) {
        setError(expResult.error.message);
      } else {
        setExpenses(expResult.data ?? []);
      }

      if (srcResult.error) {
        setError(srcResult.error.message);
      } else {
        setSources(srcResult.data ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [monthId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { expenses, sources, loading, error, refresh };
}
