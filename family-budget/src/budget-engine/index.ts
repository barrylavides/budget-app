export type Half = "half1" | "half2" | "both";
export type ExpenseHalf = "half1" | "half2";
export type ExpenseStatus = "unpaid" | "partial" | "paid" | "overpaid";

export interface Payment {
  id: string;
  amount: number;
  sourceId: string;
}

export interface Expense {
  id: string;
  amount: number;
  sourceId: string;
  half: ExpenseHalf;
  payments: Payment[];
}

export interface Source {
  id: string;
  balance: number;
  half: Half;
}

export interface CarryOver {
  id: string;
  amount: number;
  sourceId: string;
  resolvedAt: string | null;
}

/** Total amount paid across all payments for an expense. */
export function expPaid(expense: Expense): number {
  return expense.payments.reduce((sum, p) => sum + p.amount, 0);
}

/** Payment status of a single expense. */
export function expStatus(expense: Expense): ExpenseStatus {
  const paid = expPaid(expense);
  if (paid === 0) return "unpaid";
  if (paid < expense.amount) return "partial";
  if (paid === expense.amount) return "paid";
  return "overpaid";
}

/** Total budgeted amount across a list of expenses. */
export function expTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Total amount spent (paid out) from a source across all payments drawn from it. */
export function sourceSpent(source: Source, allPayments: Payment[]): number {
  return allPayments
    .filter((p) => p.sourceId === source.id)
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Remaining balance on a source = balance - sum of all payments drawn from it.
 * Does NOT account for carry-overs; use sourceEffectiveRemaining for that.
 */
export function sourceRemaining(source: Source, allPayments: Payment[]): number {
  return source.balance - sourceSpent(source, allPayments);
}

/** Total starting balance across multiple sources. */
export function sourcesTotal(sources: Source[]): number {
  return sources.reduce((sum, s) => sum + s.balance, 0);
}

/** Total starting balance across ALL sources in a month (grand total, no half filter). */
export function sourcesTotalAll(sources: Source[]): number {
  return sources.reduce((sum, s) => sum + s.balance, 0);
}

/** Filter expenses belonging to the given half. */
export function halfExpenses(expenses: Expense[], half: ExpenseHalf): Expense[] {
  return expenses.filter((e) => e.half === half);
}

/**
 * Income for a half: sum of sources whose half matches or is "both".
 * "both" sources contribute to each half independently.
 */
export function halfIncome(sources: Source[], half: ExpenseHalf): number {
  return sources
    .filter((s) => s.half === half || s.half === "both")
    .reduce((sum, s) => sum + s.balance, 0);
}

/** Total amount paid across all payments of a list of expenses. */
export function totalPaid(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + expPaid(e), 0);
}

/**
 * Effective remaining after subtracting unresolved carry-overs.
 * Resolved carry-overs (resolvedAt !== null) do not affect the balance.
 */
export function sourceEffectiveRemaining(
  source: Source,
  allPayments: Payment[],
  carryOvers: CarryOver[]
): number {
  const base = sourceRemaining(source, allPayments);
  const pendingCarryOvers = carryOvers
    .filter((co) => co.sourceId === source.id && co.resolvedAt === null)
    .reduce((sum, co) => sum + co.amount, 0);
  return base - pendingCarryOvers;
}

export * from "./statistics";
