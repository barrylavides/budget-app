export type Half = "half1" | "half2" | "both";
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

/**
 * Remaining balance on a source = balance - sum of all payments drawn from it.
 * Does NOT account for carry-overs; use sourceEffectiveRemaining for that.
 */
export function sourceRemaining(source: Source, allPayments: Payment[]): number {
  const drawn = allPayments
    .filter((p) => p.sourceId === source.id)
    .reduce((sum, p) => sum + p.amount, 0);
  return source.balance - drawn;
}

/** Total balance across multiple sources. */
export function sourcesTotal(sources: Source[]): number {
  return sources.reduce((sum, s) => sum + s.balance, 0);
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
