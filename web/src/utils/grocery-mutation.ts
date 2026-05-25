import type { GroceryAction, GroceryItem, GroceryList } from "../types/grocery";

export function applyGroceryMutation(
  data: GroceryList,
  action: GroceryAction,
  payload: GroceryItem | Pick<GroceryItem, "id">,
): GroceryList {
  const items = Array.isArray(data.items) ? [...data.items] : [];
  const now = new Date().toISOString();

  switch (action) {
    case "add": {
      const item = payload as GroceryItem;
      if (!item.id || !item.name) {
        throw new Error("Add requires id and name");
      }
      if (item.sourceItemId && items.some((i) => i.sourceItemId === item.sourceItemId)) {
        throw new Error("Item is already on the grocery list");
      }
      if (items.some((i) => i.id === item.id)) {
        throw new Error("Item already exists");
      }
      items.push({
        ...item,
        checked: item.checked ?? false,
        addedAt: item.addedAt ?? now,
      });
      break;
    }
    case "toggle": {
      const { id } = payload as Pick<GroceryItem, "id">;
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Item not found");
      items[idx] = { ...items[idx], checked: !items[idx].checked };
      break;
    }
    case "delete": {
      const { id } = payload as Pick<GroceryItem, "id">;
      const next = items.filter((i) => i.id !== id);
      if (next.length === items.length) throw new Error("Item not found");
      items.length = 0;
      items.push(...next);
      break;
    }
    case "clearChecked": {
      const next = items.filter((i) => !i.checked);
      if (next.length === items.length) {
        throw new Error("No checked items to clear");
      }
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

export function groceryItemFromInventory(item: {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
}): GroceryItem {
  return createGroceryItem({
    name: item.name,
    sourceItemId: item.id,
    quantity: item.quantity,
    unit: item.unit,
  });
}

export function createGroceryItem(item: {
  name: string;
  sourceItemId?: string;
  quantity?: number;
  unit?: string;
}): GroceryItem {
  return {
    id: crypto.randomUUID(),
    name: item.name,
    sourceItemId: item.sourceItemId,
    quantity: item.quantity,
    unit: item.unit,
    checked: false,
    addedAt: new Date().toISOString(),
  };
}
