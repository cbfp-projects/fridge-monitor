import type { Inventory, InventoryAction, InventoryItem } from "../types/inventory";

export function applyInventoryMutation(
  data: Inventory,
  action: InventoryAction,
  payload: InventoryItem | Pick<InventoryItem, "id">,
): Inventory {
  const items = Array.isArray(data.items) ? [...data.items] : [];
  const now = new Date().toISOString();

  switch (action) {
    case "add": {
      const item = payload as InventoryItem;
      if (!item.id || !item.name || !item.location || !item.expirationDate) {
        throw new Error("Add requires id, name, location, and expiration date");
      }
      if (items.some((i) => i.id === item.id)) {
        throw new Error("Item already exists");
      }
      items.push({ ...item, addedAt: item.addedAt ?? now });
      break;
    }
    case "update": {
      const item = payload as InventoryItem;
      if (!item.id) throw new Error("Update requires id");
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx === -1) throw new Error("Item not found");
      items[idx] = { ...items[idx], ...item };
      break;
    }
    case "delete": {
      const { id } = payload as Pick<InventoryItem, "id">;
      if (!id) throw new Error("Delete requires id");
      const next = items.filter((i) => i.id !== id);
      if (next.length === items.length) throw new Error("Item not found");
      items.length = 0;
      items.push(...next);
      break;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  return {
    ...data,
    version: data.version ?? 1,
    updatedAt: now,
    items,
  };
}
