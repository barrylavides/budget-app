import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useMonthId(yearMonth: string): { monthId: string | null; loading: boolean } {
  const [monthId, setMonthId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);

    if (!year || !monthNum) {
      setMonthId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("months")
        .select("id")
        .eq("year", year)
        .eq("month_num", monthNum)
        .maybeSingle();

      if (!cancelled) {
        setMonthId(!error && data ? data.id : null);
        setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  return { monthId, loading };
}
