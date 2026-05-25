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
}

export type GroceryAction = "add" | "toggle" | "delete" | "clearChecked";

export interface GroceryUpdateRequest {
  action: GroceryAction;
  payload: GroceryItem | Pick<GroceryItem, "id">;
}
