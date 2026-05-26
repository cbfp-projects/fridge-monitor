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

export interface NameHistoryEntry {
  name: string;
  location: Location;
  quantity?: number;
  unit?: string;
  lastUsedAt: string;
}

export interface Inventory {
  version: number;
  updatedAt: string;
  items: InventoryItem[];
  nameHistory?: NameHistoryEntry[];
}

export type InventoryAction = "add" | "update" | "delete";

export type LocationFilter = Location;

export interface InventoryUpdateRequest {
  secret: string;
  action: InventoryAction;
  payload: InventoryItem | Pick<InventoryItem, "id">;
}
