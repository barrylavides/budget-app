import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Source = Database["public"]["Tables"]["sources"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

export interface UseSourcesResult {
  sources: Source[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addSource: (data: Omit<Source, "id" | "created_at" | "updated_at" | "created_by">) => Promise<string | null>;
  updateSource: (id: string, data: Partial<Omit<Source, "id" | "created_at" | "updated_at" | "created_by">>) => Promise<string | null>;
  deleteSource: (id: string) => Promise<string | null>;
}

export function useSources(monthId: string | null): UseSourcesResult {
  const [sources, setSources] = useState<Source[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!monthId) {
      setSources([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: sourceData, error: sourceErr } = await supabase
        .from("sources")
        .select("*")
        .eq("month_id", monthId!)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (sourceErr) {
        setError(sourceErr.message);
        setLoading(false);
        return;
      }

      setSources(sourceData ?? []);

      const { data: expenseData, error: expenseErr } = await supabase
        .from("expenses")
        .select("id")
        .eq("month_id", monthId!);

      if (cancelled) return;

      if (expenseErr || !expenseData || expenseData.length === 0) {
        setPayments([]);
        setLoading(false);
        return;
      }

      const expenseIds = expenseData.map((e) => e.id);

      const { data: paymentData, error: paymentErr } = await supabase
        .from("payments")
        .select("*")
        .in("expense_id", expenseIds);

      if (cancelled) return;

      if (paymentErr) {
        setError(paymentErr.message);
      } else {
        setPayments(paymentData ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [monthId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const addSource = useCallback(
    async (data: Omit<Source, "id" | "created_at" | "updated_at" | "created_by">): Promise<string | null> => {
      const { error: insertErr } = await supabase.from("sources").insert(data);
      if (insertErr) return insertErr.message;
      refresh();
      return null;
    },
    [refresh]
  );

  const updateSource = useCallback(
    async (
      id: string,
      data: Partial<Omit<Source, "id" | "created_at" | "updated_at" | "created_by">>
    ): Promise<string | null> => {
      const { error: updateErr } = await supabase.from("sources").update(data).eq("id", id);
      if (updateErr) return updateErr.message;
      refresh();
      return null;
    },
    [refresh]
  );

  const deleteSource = useCallback(
    async (id: string): Promise<string | null> => {
      const { error: deleteErr } = await supabase.from("sources").delete().eq("id", id);
      if (deleteErr) return deleteErr.message;
      refresh();
      return null;
    },
    [refresh]
  );

  return { sources, payments, loading, error, refresh, addSource, updateSource, deleteSource };
}
