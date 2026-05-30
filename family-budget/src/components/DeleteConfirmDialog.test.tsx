import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

describe("DeleteConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <DeleteConfirmDialog
        open={false}
        expenseName="Test Expense"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByTestId("delete-confirm-message")).toBeNull();
  });

  it("renders dialog when open", () => {
    render(
      <DeleteConfirmDialog
        open={true}
        expenseName="Electricity Bill"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId("delete-confirm-message")).toBeTruthy();
    expect(screen.getByText("Electricity Bill")).toBeTruthy();
  });

  it("calls onConfirm when Delete button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmDialog
        open={true}
        expenseName="Test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("delete-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel button clicked", () => {
    const onCancel = vi.fn();
    render(
      <DeleteConfirmDialog
        open={true}
        expenseName="Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByTestId("delete-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
