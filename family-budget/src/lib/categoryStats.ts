import type { ExpenseRow } from "@/hooks/useExpenses";
import { CATEGORIES, CATEGORY_ICONS } from "./categories";
import type { Category } from "./categories";

export interface CategoryStat {
  category: Category;
  icon: string;
  count: number;
  total: number;
  paid: number;
}

/**
 * Compute per-category stats from expenses.
 * paid is stubbed as 0 for now (no payments table queried here).
 */
export function computeCategoryStats(expenses: ExpenseRow[]): CategoryStat[] {
  const stats: CategoryStat[] = CATEGORIES.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    return {
      category: cat,
      icon: CATEGORY_ICONS[cat],
      count: catExpenses.length,
      total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      paid: 0, // stub — no payments data here
    };
  });

  // Only return categories that have at least one expense OR all categories
  return stats;
}
