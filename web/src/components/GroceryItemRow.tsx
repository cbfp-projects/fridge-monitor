import type { GroceryItem } from "../types/grocery";

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
}

export function GroceryItemRow({ item, onToggle }: GroceryItemRowProps) {
  const qty =
    item.quantity != null
      ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
      : null;

  return (
    <label className={`grocery-row ${item.checked ? "grocery-row-checked" : ""}`}>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item)}
        className="grocery-checkbox"
      />
      <span className="grocery-row-text">
        <span className="grocery-row-name">{item.name}</span>
        {qty && <span className="grocery-row-meta">{qty}</span>}
      </span>
    </label>
  );
}
