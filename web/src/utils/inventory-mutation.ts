import type { Inventory, InventoryAction, InventoryItem } from "../types/inventory";
import { itemToNameHistoryEntry, upsertNameHistory } from "./name-history";

export function applyInventoryMutation(
  data: Inventory,
  action: InventoryAction,
  payload: InventoryItem | Pick<InventoryItem, "id">,
): Inventory {
  const items = Array.isArray(data.items) ? [...data.items] : [];
  let nameHistory = Array.isArray(data.nameHistory) ? [...data.nameHistory] : [];
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
      const saved = { ...item, addedAt: item.addedAt ?? now };
      items.push(saved);
      nameHistory = upsertNameHistory(nameHistory, saved, now);
      break;
    }
    case "update": {
      const item = payload as InventoryItem;
      if (!item.id) throw new Error("Update requires id");
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx === -1) throw new Error("Item not found");
      const saved = { ...items[idx], ...item };
      items[idx] = saved;
      nameHistory = upsertNameHistory(nameHistory, saved, now);
      break;
    }
    case "delete": {
      const { id } = payload as Pick<InventoryItem, "id">;
      if (!id) throw new Error("Delete requires id");
      const removed = items.find((i) => i.id === id);
      if (!removed) throw new Error("Item not found");
      nameHistory = upsertNameHistory(nameHistory, removed, now);
      const next = items.filter((i) => i.id !== id);
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
    nameHistory,
  };
}

export { itemToNameHistoryEntry };
