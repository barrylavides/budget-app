import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface DeleteConfirmDialogProps {
  open: boolean;
  expenseName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  open,
  expenseName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete Expense">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p
          style={{ fontSize: 14, color: "var(--color-ink-2)", lineHeight: 1.5 }}
          data-testid="delete-confirm-message"
        >
          Are you sure you want to delete{" "}
          <strong style={{ color: "var(--color-ink)" }}>{expenseName}</strong>? This cannot be
          undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="outline" type="button" onClick={onCancel} data-testid="delete-cancel">
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={onConfirm} data-testid="delete-confirm">
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
