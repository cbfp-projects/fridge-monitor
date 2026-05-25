import type { InventoryItem } from "../types/inventory";
import { EditIcon } from "./EditIcon";
import { ExpiryBadge } from "./ExpiryBadge";

interface ItemCardProps {
  item: InventoryItem;
  onBuy: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onGroceryList: boolean;
}

export function ItemCard({ item, onBuy, onEdit, onDelete, onGroceryList }: ItemCardProps) {
  const qty =
    item.quantity != null
      ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
      : null;

  return (
    <article className={`item-card item-card--${item.location}`}>
      <div className="item-card-main">
        <div className="item-card-header">
          <h3 className="item-name">{item.name}</h3>
          {qty ? <span className="item-qty">{qty}</span> : null}
          <button
            type="button"
            className="btn btn-edit-inline"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
          >
            <EditIcon />
          </button>
          <ExpiryBadge expirationDate={item.expirationDate} />
        </div>
        {item.notes ? <p className="item-notes">{item.notes}</p> : null}
      </div>
      <div className="item-actions">
        <button
          type="button"
          className="btn btn-action btn-buy"
          onClick={() => onBuy(item)}
          disabled={onGroceryList}
          title={onGroceryList ? "Already on grocery list" : "Add to grocery list"}
        >
          Buy
        </button>
        <button
          type="button"
          className="btn btn-action btn-action-danger"
          onClick={() => onDelete(item)}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
