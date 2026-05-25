import type { GroceryAction, GroceryItem, GroceryList } from "../types/grocery";

function addToHistory(history: GroceryItem[], ...toAdd: GroceryItem[]): void {
  for (const item of toAdd) {
    // Replace existing history entry for same id, or prepend a new one
    const existing = history.findIndex((h) => h.id === item.id);
    if (existing !== -1) {
      history.splice(existing, 1);
    }
    history.unshift({ ...item, checked: false });
  }
}

export function applyGroceryMutation(
  data: GroceryList,
  action: GroceryAction,
  payload: GroceryItem | Pick<GroceryItem, "id">,
): GroceryList {
  const items = Array.isArray(data.items) ? [...data.items] : [];
  const shoppingBag = Array.isArray(data.shoppingBag) ? [...data.shoppingBag] : [];
  const history = Array.isArray(data.history) ? [...data.history] : [];
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
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Item not found");
      addToHistory(history, items[idx]);
      items.splice(idx, 1);
      break;
    }
    case "clearChecked": {
      const checked = items.filter((i) => i.checked);
      if (checked.length === 0) {
        throw new Error("No checked items to clear");
      }
      addToHistory(history, ...checked);
      items.length = 0;
      items.push(...data.items.filter((i) => !i.checked));
      break;
    }
    case "checkInBag": {
      const checkedItems = items.filter((i) => i.checked);
      if (checkedItems.length === 0) {
        throw new Error("No checked items to check in");
      }
      const remaining = items.filter((i) => !i.checked);
      items.length = 0;
      items.push(...remaining);
      shoppingBag.push(...checkedItems.map((item) => ({ ...item, checked: false })));
      break;
    }
    case "removeBagItem": {
      const { id } = payload as Pick<GroceryItem, "id">;
      const idx = shoppingBag.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Bag item not found");
      addToHistory(history, shoppingBag[idx]);
      shoppingBag.splice(idx, 1);
      break;
    }
    case "restoreFromHistory": {
      const { id } = payload as Pick<GroceryItem, "id">;
      const idx = history.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("History item not found");
      const restored = history.splice(idx, 1)[0];
      items.push({
        ...restored,
        id: crypto.randomUUID(),
        checked: false,
        addedAt: now,
      });
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
    shoppingBag,
    history,
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
