import type { InventoryItem } from "../types/inventory";
import { formatDate } from "../utils/expiry";
import { ExpiryBadge } from "./ExpiryBadge";

interface ItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const qty =
    item.quantity != null
      ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
      : null;

  return (
    <article className="item-card">
      <div className="item-card-main">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-meta">
          <span className={`location-pill location-${item.location}`}>
            {item.location}
          </span>
          <span>·</span>
          <span>{formatDate(item.expirationDate)}</span>
          {qty && (
            <>
              <span>·</span>
              <span>{qty}</span>
            </>
          )}
        </p>
        {item.notes ? <p className="item-notes">{item.notes}</p> : null}
        <ExpiryBadge expirationDate={item.expirationDate} />
      </div>
      <div className="item-card-actions">
        <button type="button" className="btn btn-ghost" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          onClick={() => onDelete(item)}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
