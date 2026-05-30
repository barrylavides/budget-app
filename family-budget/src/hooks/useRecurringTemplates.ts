import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Template = Database["public"]["Tables"]["recurring_expense_templates"]["Row"];

export interface UseRecurringTemplatesResult {
  templates: Template[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addTemplate: (
    data: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
  ) => Promise<string | null>;
  updateTemplate: (
    id: string,
    data: Partial<Omit<Template, "id" | "created_at" | "updated_at" | "created_by">>
  ) => Promise<string | null>;
  deleteTemplate: (id: string) => Promise<string | null>;
}

export function useRecurringTemplates(householdId: string | null): UseRecurringTemplatesResult {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!householdId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("recurring_expense_templates")
        .select("*")
        .eq("household_id", householdId!)
        .order("name", { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        setTemplates(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [householdId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const addTemplate = useCallback(
    async (
      data: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
    ): Promise<string | null> => {
      const { error: err } = await supabase
        .from("recurring_expense_templates")
        .insert(data);
      if (err) return err.message;
      refresh();
      return null;
    },
    [refresh]
  );

  const updateTemplate = useCallback(
    async (
      id: string,
      data: Partial<Omit<Template, "id" | "created_at" | "updated_at" | "created_by">>
    ): Promise<string | null> => {
      const { error: err } = await supabase
        .from("recurring_expense_templates")
        .update(data)
        .eq("id", id);
      if (err) return err.message;
      refresh();
      return null;
    },
    [refresh]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<string | null> => {
      const { error: err } = await supabase
        .from("recurring_expense_templates")
        .delete()
        .eq("id", id);
      if (err) return err.message;
      refresh();
      return null;
    },
    [refresh]
  );

  return { templates, loading, error, refresh, addTemplate, updateTemplate, deleteTemplate };
}
