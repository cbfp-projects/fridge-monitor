import { useState } from "react";
import type { InventoryItem } from "../types/inventory";

const SECRET_KEY = "fridge-monitor-secret";

interface DeleteConfirmModalProps {
  item: InventoryItem | null;
  open: boolean;
  saving: boolean;
  error: string | null;
  canSave: boolean;
  onClose: () => void;
  onConfirm: (secret: string, item: InventoryItem) => void;
}

export function DeleteConfirmModal({
  item,
  open,
  saving,
  error,
  canSave,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? "");

  if (!open || !item) return null;

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    sessionStorage.setItem(SECRET_KEY, secret);
    onConfirm(secret, item);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal-sm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>Remove item?</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p>
          Remove <strong>{item.name}</strong> from the inventory?
        </p>
        <form onSubmit={handleConfirm}>
          <label>
            Household password
            <input
              required
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={saving || !canSave}
            >
              {saving ? "Removing…" : "Remove"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
