import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

export interface ExpenseWithPayments extends Expense {
  payments: Payment[];
}

export interface UseExpensesResult {
  expenses: ExpenseWithPayments[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addPayment: (
    expenseId: string,
    data: { paid_on: string; amount: number; source_id: string | null; note: string | null }
  ) => Promise<string | null>;
  deletePayment: (paymentId: string) => Promise<string | null>;
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
        .in("expense_id", expenseIds)
        .order("paid_on", { ascending: true });

      if (cancelled) return;
      if (paymentErr) {
        setError(paymentErr.message);
        setLoading(false);
        return;
      }

      const paymentsByExpense = new Map<string, Payment[]>();
      for (const p of paymentData ?? []) {
        const arr = paymentsByExpense.get(p.expense_id) ?? [];
        arr.push(p);
        paymentsByExpense.set(p.expense_id, arr);
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

  const addPayment = useCallback(
    async (
      expenseId: string,
      data: { paid_on: string; amount: number; source_id: string | null; note: string | null }
    ): Promise<string | null> => {
      const { error: insertErr } = await supabase.from("payments").insert({
        expense_id: expenseId,
        ...data,
      });
      if (insertErr) return insertErr.message;
      refresh();
      return null;
    },
    [refresh]
  );

  const deletePayment = useCallback(
    async (paymentId: string): Promise<string | null> => {
      const { error: deleteErr } = await supabase.from("payments").delete().eq("id", paymentId);
      if (deleteErr) return deleteErr.message;
      refresh();
      return null;
    },
    [refresh]
  );

  return { expenses, loading, error, refresh, addPayment, deletePayment };
}
