export interface CategoryAggregate {
  category: string;
  amount: number;
  percentage: number;
}

export interface TagAggregate {
  tag: string;
  amount: number;
  percentage: number;
}

export interface StatsSummary {
  totalIncome: number;
  totalExpenses: number;
  netRemaining: number;
}

// Input types (plain data, no DB dependency)
export interface StatsExpense {
  amount: number;
  category: string;
  tag: string | null;
}

export interface StatsSource {
  balance: number;
}

/**
 * Distribute 100 percentage points among items using the "largest remainder" method.
 * Each item has a `rawPercent` (exact float). We floor each, then distribute
 * remaining integer points to the items with the largest fractional parts.
 */
function largestRemainderPercentages(amounts: number[], total: number): number[] {
  if (amounts.length === 0) return [];
  if (total === 0) {
    // All amounts must be 0 if total is 0; distribute evenly or return zeros
    return amounts.map(() => 0);
  }

  const rawPercentages = amounts.map((a) => (a / total) * 100);
  const floored = rawPercentages.map((p) => Math.floor(p));
  const remainders = rawPercentages.map((p, i) => p - floored[i]);

  const totalFloored = floored.reduce((s, v) => s + v, 0);
  let leftover = 100 - totalFloored;

  // Sort indices by remainder descending to assign leftover points
  const indices = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r)
    .map((x) => x.i);

  const result = [...floored];
  for (let k = 0; k < leftover; k++) {
    result[indices[k]] += 1;
  }

  return result;
}

/**
 * Aggregate expenses by category, sorted by amount descending.
 * Percentages sum to exactly 100% using largest-remainder method.
 * Returns [] for empty input.
 */
export function aggregateByCategory(expenses: StatsExpense[]): CategoryAggregate[] {
  if (expenses.length === 0) return [];

  // Group amounts by category
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }

  // Sort by amount desc
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, a]) => s + a, 0);
  const percentages = largestRemainderPercentages(
    entries.map(([, a]) => a),
    total
  );

  return entries.map(([category, amount], i) => ({
    category,
    amount,
    percentage: percentages[i],
  }));
}

/**
 * Aggregate expenses by tag, sorted by amount descending.
 * null tags are grouped under "untagged".
 * Percentages sum to exactly 100% using largest-remainder method.
 * Returns [] for empty input.
 */
export function aggregateByTag(expenses: StatsExpense[]): TagAggregate[] {
  if (expenses.length === 0) return [];

  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = e.tag ?? "untagged";
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }

  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, a]) => s + a, 0);
  const percentages = largestRemainderPercentages(
    entries.map(([, a]) => a),
    total
  );

  return entries.map(([tag, amount], i) => ({
    tag,
    amount,
    percentage: percentages[i],
  }));
}

/**
 * Compute a high-level budget summary.
 * totalIncome  = sum of all source balances
 * totalExpenses = sum of all expense amounts
 * netRemaining  = totalIncome - totalExpenses
 */
export function computeStatsSummary(
  sources: StatsSource[],
  expenses: StatsExpense[]
): StatsSummary {
  const totalIncome = sources.reduce((s, src) => s + src.balance, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  return {
    totalIncome,
    totalExpenses,
    netRemaining: totalIncome - totalExpenses,
  };
}
