export type Location = "fridge" | "freezer";

export interface InventoryItem {
  id: string;
  name: string;
  location: Location;
  expirationDate: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  addedAt: string;
}

export interface Inventory {
  version: number;
  updatedAt: string;
  items: InventoryItem[];
}

export type InventoryAction = "add" | "update" | "delete";

export type LocationFilter = "all" | Location;

export interface InventoryUpdateRequest {
  secret: string;
  action: InventoryAction;
  payload: InventoryItem | Pick<InventoryItem, "id">;
}
