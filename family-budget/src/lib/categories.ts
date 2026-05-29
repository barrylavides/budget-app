export type Category =
  | "Bills"
  | "Food"
  | "Utilities"
  | "Home"
  | "Travel"
  | "Health"
  | "Education"
  | "Other";

export const CATEGORIES: Category[] = [
  "Bills",
  "Food",
  "Utilities",
  "Home",
  "Travel",
  "Health",
  "Education",
  "Other",
];

export type Tag = "needs" | "wants" | "savings" | "investment" | "business";

export const TAGS: Tag[] = ["needs", "wants", "savings", "investment", "business"];

export type Half = "half1" | "half2";

export const HALVES: { value: Half; label: string }[] = [
  { value: "half1", label: "1st Half" },
  { value: "half2", label: "2nd Half" },
];

export const CATEGORY_ICONS: Record<Category, string> = {
  Bills: "🧾",
  Food: "🍽",
  Utilities: "💡",
  Home: "🏠",
  Travel: "✈️",
  Health: "💊",
  Education: "📚",
  Other: "📦",
};

export const TAG_COLORS: Record<Tag, { bg: string; text: string; border: string }> = {
  needs: { bg: "var(--color-blue-bg)", text: "var(--color-blue)", border: "var(--color-blue-rule)" },
  wants: { bg: "var(--color-amber-bg)", text: "var(--color-amber)", border: "var(--color-amber-rule)" },
  savings: {
    bg: "var(--color-green-bg)",
    text: "var(--color-green)",
    border: "var(--color-green-rule)",
  },
  investment: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  business: { bg: "var(--color-linen-2)", text: "var(--color-ink-3)", border: "var(--color-rule)" },
};
