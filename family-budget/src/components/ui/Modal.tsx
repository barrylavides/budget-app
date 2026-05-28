import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,14,11,0.4)",
        }}
      />
      {/* Dialog */}
      <div
        style={{
          position: "relative",
          background: "var(--color-linen)",
          borderRadius: 10,
          border: "1px solid var(--color-rule)",
          boxShadow: "0 8px 40px rgba(14,14,11,0.18)",
          minWidth: 360,
          maxWidth: "90vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {title && (
          <div
            style={{
              padding: "18px 20px 14px",
              borderBottom: "1px solid var(--color-rule)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {title}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-ink-4)",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: "16px 20px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
