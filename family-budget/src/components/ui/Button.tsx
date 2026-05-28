import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "ink" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  ink: {
    background: "var(--color-ink)",
    color: "var(--color-linen)",
    border: "none",
  },
  outline: {
    background: "transparent",
    border: "1.5px solid var(--color-linen-4)",
    color: "var(--color-ink-2)",
  },
  danger: {
    background: "var(--color-red)",
    color: "#fff",
    border: "none",
  },
};

export function Button({ variant = "ink", children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        borderRadius: 5,
        padding: "9px 16px",
        cursor: "pointer",
        transition: "all 0.15s",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
