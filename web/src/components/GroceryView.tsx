import type { GroceryItem, GroceryList } from "../types/grocery";
import { GroceryItemRow } from "./GroceryItemRow";

interface GroceryViewProps {
  grocery: GroceryList | null;
  loading: boolean;
  onToggle: (item: GroceryItem) => void;
  onClearChecked: () => void;
  onCheckInBag: () => void;
}

export function GroceryView({
  grocery,
  loading,
  onToggle,
  onClearChecked,
  onCheckInBag,
}: GroceryViewProps) {
  const items = grocery?.items ?? [];
  const checkedCount = items.filter((i) => i.checked).length;
  const unchecked = items.filter((i) => !i.checked);
  const checkedOnly = items.filter((i) => i.checked);

  if (loading) {
    return <p className="state-message">Loading grocery list…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="state-message state-empty">
        Nothing on the list yet — tap Add item below or Buy on a fridge item.
      </p>
    );
  }

  return (
    <div className="grocery-view">
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
    </div>
  );
}
