import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

const variantStyles: Record<ToastVariant, React.CSSProperties> = {
  success: {
    background: "var(--color-green-bg)",
    border: "1px solid var(--color-green-rule)",
    color: "var(--color-green)",
  },
  error: {
    background: "var(--color-red-bg)",
    border: "1px solid var(--color-red-rule)",
    color: "var(--color-red)",
  },
  info: {
    background: "var(--color-linen-2)",
    border: "1px solid var(--color-rule)",
    color: "var(--color-ink-3)",
  },
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 3500);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 4px 12px rgba(14,14,11,0.1)",
        minWidth: 260,
        ...variantStyles[item.variant],
      }}
    >
      <span>{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: 0.6,
          fontSize: 16,
          lineHeight: 1,
          color: "inherit",
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 300,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} item={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
