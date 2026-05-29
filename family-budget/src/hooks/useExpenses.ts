import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type DbExpense = Database["public"]["Tables"]["expenses"]["Row"];
type DbPayment = Database["public"]["Tables"]["payments"]["Row"];

export interface ExpenseWithPayments extends DbExpense {
  payments: DbPayment[];
}

export interface UseExpensesResult {
  expenses: ExpenseWithPayments[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExpenses(monthId: string | null): UseExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!monthId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: expenseData, error: expenseErr } = await supabase
        .from("expenses")
        .select("*")
        .eq("month_id", monthId!)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (expenseErr) {
        setError(expenseErr.message);
        setLoading(false);
        return;
      }

      const rows = expenseData ?? [];
      if (rows.length === 0) {
        setExpenses([]);
        setLoading(false);
        return;
      }

      const expenseIds = rows.map((e) => e.id);
      const { data: paymentData, error: paymentErr } = await supabase
        .from("payments")
        .select("*")
        .in("expense_id", expenseIds);

      if (cancelled) return;

      if (paymentErr) {
        setError(paymentErr.message);
        setLoading(false);
        return;
      }

      const payments = paymentData ?? [];
      const paymentsByExpense = new Map<string, DbPayment[]>();
      for (const p of payments) {
        const list = paymentsByExpense.get(p.expense_id) ?? [];
        list.push(p);
        paymentsByExpense.set(p.expense_id, list);
      }

      setExpenses(rows.map((e) => ({ ...e, payments: paymentsByExpense.get(e.id) ?? [] })));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [monthId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { expenses, loading, error, refresh };
}
