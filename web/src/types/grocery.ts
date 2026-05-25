export interface GroceryItem {
  id: string;
  name: string;
  sourceItemId?: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  addedAt: string;
}

export interface GroceryList {
  version: number;
  updatedAt: string;
  items: GroceryItem[];
  shoppingBag?: GroceryItem[];
}

export type GroceryAction =
  | "add"
  | "toggle"
  | "delete"
  | "clearChecked"
  | "checkInBag"
  | "removeBagItem";

export interface GroceryUpdateRequest {
  action: GroceryAction;
  payload: GroceryItem | Pick<GroceryItem, "id">;
}
