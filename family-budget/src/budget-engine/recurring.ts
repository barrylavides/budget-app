export interface RecurringTemplate {
  id: string;
  name: string;
  category: string;
  half: string;
  default_amount: number;
  default_source_name: string | null;
  tag: string | null;
  cadence: "monthly" | "quarterly" | "yearly";
  active: boolean;
  start_year_month: number; // YYYYMM integer, e.g. 202601
}

export interface SourceStub {
  id: string;
  name: string;
}

export interface ExpenseInsert {
  month_id: string;
  name: string;
  category: string;
  half: string;
  amount: number;
  source_id: string | null;
  tag: string | null;
}

/** Returns true if the template should generate an expense for the given year/month. */
export function shouldGenerate(
  template: RecurringTemplate,
  year: number,
  monthNum: number
): boolean {
  if (!template.active) return false;

  const targetYM = year * 100 + monthNum;
  if (targetYM < template.start_year_month) return false;

  const startMonthNum = template.start_year_month % 100;

  switch (template.cadence) {
    case "monthly":
      return true;
    case "quarterly":
      return [1, 4, 7, 10].includes(monthNum);
    case "yearly":
      return monthNum === startMonthNum;
    default:
      return false;
  }
}

/** Best-effort source ID match by name (case-insensitive). Falls back to null. */
export function matchSourceByName(
  sources: SourceStub[],
  name: string | null
): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const found = sources.find((s) => s.name.toLowerCase().trim() === lower);
  return found?.id ?? null;
}

/** Generate expense insert rows from active templates that apply for the given month. */
export function generateExpenses(
  templates: RecurringTemplate[],
  monthId: string,
  year: number,
  monthNum: number,
  sources: SourceStub[]
): ExpenseInsert[] {
  return templates
    .filter((t) => shouldGenerate(t, year, monthNum))
    .map((t) => ({
      month_id: monthId,
      name: t.name,
      category: t.category,
      half: t.half,
      amount: t.default_amount,
      source_id: matchSourceByName(sources, t.default_source_name),
      tag: t.tag,
    }));
}
