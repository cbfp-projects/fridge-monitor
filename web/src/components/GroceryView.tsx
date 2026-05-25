import type { GroceryItem, GroceryList } from "../types/grocery";
import { GroceryItemRow } from "./GroceryItemRow";

interface GroceryViewProps {
  grocery: GroceryList | null;
  loading: boolean;
  onToggle: (item: GroceryItem) => void;
  onClearChecked: () => void;
  onCheckInBag: () => void;
  onRestoreFromHistory: (item: GroceryItem) => void;
}

export function GroceryView({
  grocery,
  loading,
  onToggle,
  onClearChecked,
  onCheckInBag,
  onRestoreFromHistory,
}: GroceryViewProps) {
  const items = grocery?.items ?? [];
  const history = grocery?.history ?? [];
  const checkedCount = items.filter((i) => i.checked).length;
  const unchecked = items.filter((i) => !i.checked);
  const checkedOnly = items.filter((i) => i.checked);

  if (loading) {
    return <p className="state-message">Loading grocery list…</p>;
  }

  if (items.length === 0 && history.length === 0) {
    return (
      <p className="state-message state-empty">
        Nothing on the list yet — tap Add item below or Buy on a fridge item.
      </p>
    );
  }

  return (
    <div className="grocery-view">
      {items.length === 0 && history.length > 0 && (
        <p className="state-message state-empty">
          Nothing on the list yet — tap Add item below or Buy on a fridge item.
        </p>
      )}
      {unchecked.length > 0 && (
        <ul className="item-list grocery-list">
          {unchecked.map((item) => (
            <li key={item.id}>
              <GroceryItemRow item={item} onToggle={onToggle} />
            </li>
          ))}
        </ul>
      )}
      {checkedOnly.length > 0 && (
        <>
          <p className="grocery-section-label">Checked off</p>
          <ul className="item-list grocery-list">
            {checkedOnly.map((item) => (
              <li key={item.id}>
                <GroceryItemRow item={item} onToggle={onToggle} />
              </li>
            ))}
          </ul>
        </>
      )}
      {checkedCount > 0 && (
        <div className="grocery-actions">
          <button type="button" className="btn btn-secondary" onClick={onCheckInBag}>
            Check in bag ({checkedCount})
          </button>
          <button type="button" className="btn btn-secondary btn-clear-checked" onClick={onClearChecked}>
            Clear checked ({checkedCount})
          </button>
        </div>
      )}
      {history.length > 0 && (
        <>
          <p className="grocery-section-label">Past items</p>
          <ul className="item-list grocery-list">
            {history.map((item) => (
              <li key={item.id}>
                <div className="grocery-row grocery-row-history">
                  <span className="grocery-row-text">
                    <span className="grocery-row-name">{item.name}</span>
                    {item.quantity != null && (
                      <span className="grocery-row-meta">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn-restore"
                    onClick={() => onRestoreFromHistory(item)}
                    aria-label={`Add ${item.name} back to list`}
                  >
                    + Add back
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
