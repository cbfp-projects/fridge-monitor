import { FridgeIcon } from "./FridgeIcon";
import type { GroceryItem, GroceryList } from "../types/grocery";

interface ShoppingBagViewProps {
  grocery: GroceryList | null;
  loading: boolean;
  onClear: (item: GroceryItem) => void;
  onPutAway: (item: GroceryItem, location: "fridge" | "freezer") => void;
}

export function ShoppingBagView({
  grocery,
  loading,
  onClear,
  onPutAway,
}: ShoppingBagViewProps) {
  const items = grocery?.shoppingBag ?? [];

  if (loading) {
    return <p className="state-message">Loading shopping bag…</p>;
  }

  if (items.length === 0) {
    return <p className="state-message state-empty">Nothing in the bag yet. Check grocery items into the bag while shopping.</p>;
  }

  return (
    <ul className="item-list grocery-list">
      {items.map((item) => {
        const qty =
          item.quantity != null
            ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
            : null;

        return (
          <li key={item.id}>
            <article className="shopping-bag-row">
              <div className="shopping-bag-row-text">
                <span className="grocery-row-name">{item.name}</span>
                {qty && <span className="grocery-row-meta">{qty}</span>}
              </div>
              <div className="shopping-bag-actions">
                <button type="button" className="btn btn-bag-action" onClick={() => onPutAway(item, "fridge")} aria-label={`Put ${item.name} in the fridge`}>
                  <FridgeIcon />
                </button>
                <button type="button" className="btn btn-bag-action" onClick={() => onPutAway(item, "freezer")} aria-label={`Put ${item.name} in the freezer`}>
                  <span aria-hidden>❄</span>
                </button>
                <button type="button" className="btn btn-bag-clear" onClick={() => onClear(item)}>
                  Clear
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
