import { useEffect, useMemo, useRef, useState } from "react";
import type { Inventory, InventoryAction, InventoryItem, NameHistoryEntry } from "../types/inventory";
import {
  buildSuggestionEntries,
  filterSuggestions,
  formatSuggestionMeta,
} from "../utils/item-suggestions";

const SECRET_KEY = "fridge-monitor-secret";

interface ItemFormModalProps {
  mode: "add" | "edit";
  item: InventoryItem;
  inventory: Inventory | null;
  open: boolean;
  saving: boolean;
  error: string | null;
  canSave: boolean;
  onClose: () => void;
  onSubmit: (secret: string, action: InventoryAction, item: InventoryItem) => void;
}

export function ItemFormModal({
  mode,
  item,
  inventory,
  open,
  saving,
  error,
  canSave,
  onClose,
  onSubmit,
}: ItemFormModalProps) {
  const [draft, setDraft] = useState(item);
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? "");
  const [nameFocused, setNameFocused] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(item);
    setNameFocused(false);
  }, [item]);

  const allSuggestions = useMemo(
    () => (inventory ? buildSuggestionEntries(inventory) : []),
    [inventory],
  );

  const visibleSuggestions = useMemo(() => {
    if (mode !== "add" || !nameFocused) return [];
    return filterSuggestions(allSuggestions, draft.name);
  }, [mode, nameFocused, allSuggestions, draft.name]);

  if (!open) return null;

  function update<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applySuggestion(entry: NameHistoryEntry) {
    setDraft((prev) => ({
      ...prev,
      name: entry.name,
      location: entry.location,
      quantity: entry.quantity,
      unit: entry.unit ?? "",
    }));
    setNameFocused(false);
    nameInputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    sessionStorage.setItem(SECRET_KEY, secret);
    const payload: InventoryItem = {
      ...draft,
      name: draft.name.trim(),
      notes: draft.notes?.trim() ?? "",
      unit: draft.unit?.trim() ?? "",
      quantity:
        draft.quantity === undefined || Number.isNaN(Number(draft.quantity))
          ? undefined
          : Number(draft.quantity),
    };
    onSubmit(secret, mode === "add" ? "add" : "update", payload);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="item-form-title">{mode === "add" ? "Add item" : "Edit item"}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="name-field">
            Name
            <input
              ref={nameInputRef}
              required
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setNameFocused(false), 150);
              }}
              placeholder="e.g. Greek yogurt"
              autoFocus
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={visibleSuggestions.length > 0}
              aria-controls={visibleSuggestions.length > 0 ? "name-suggestions" : undefined}
            />
            {visibleSuggestions.length > 0 && (
              <ul id="name-suggestions" className="name-suggestions" role="listbox">
                {visibleSuggestions.map((entry) => (
                  <li key={entry.name} role="presentation">
                    <button
                      type="button"
                      role="option"
                      className="name-suggestion-row"
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        applySuggestion(entry);
                      }}
                      onClick={() => applySuggestion(entry)}
                    >
                      <span className="name-suggestion-label">{entry.name}</span>
                      <span className="name-suggestion-meta">{formatSuggestionMeta(entry)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>

          <label>
            Location
            <select
              value={draft.location}
              onChange={(e) => update("location", e.target.value as InventoryItem["location"])}
            >
              <option value="fridge">Fridge</option>
              <option value="freezer">Freezer</option>
            </select>
          </label>

          <label>
            Expiration date
            <input
              required
              type="date"
              value={draft.expirationDate}
              onChange={(e) => update("expirationDate", e.target.value)}
            />
          </label>

          <div className="field-row">
            <label>
              Quantity
              <input
                type="number"
                min={0}
                step="any"
                value={draft.quantity ?? ""}
                onChange={(e) =>
                  update(
                    "quantity",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </label>
            <label>
              Unit
              <input
                value={draft.unit ?? ""}
                onChange={(e) => update("unit", e.target.value)}
                placeholder="e.g. oz, bag"
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Household password
            <input
              required
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {!canSave && (
            <p className="form-hint">
              Saving requires GitHub repo, contents token, and household password in the build (see README).
            </p>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
              {saving ? "Saving…" : mode === "add" ? "Add item" : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
