import type { FormEvent } from "react";

interface GroceryItemDraft {
  name: string;
  quantity?: number;
  unit?: string;
}

interface GroceryItemFormModalProps {
  onClose: () => void;
  onSubmit: (item: GroceryItemDraft) => void;
}

export function GroceryItemFormModal({ onClose, onSubmit }: GroceryItemFormModalProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const quantityValue = String(formData.get("quantity") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();

    if (!name) return;

    onSubmit({
      name,
      quantity: quantityValue === "" ? undefined : Number(quantityValue),
      unit: unit || undefined,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grocery-item-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="grocery-item-form-title">Add item</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input required name="name" placeholder="e.g. Bananas" autoFocus />
          </label>

          <div className="field-row">
            <label>
              Quantity
              <input type="number" name="quantity" min={0} step="any" />
            </label>
            <label>
              Unit
              <input name="unit" placeholder="e.g. bunch, lb" />
            </label>
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add item
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
