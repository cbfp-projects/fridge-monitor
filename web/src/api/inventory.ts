import type {
  Inventory,
  InventoryAction,
  InventoryItem,
  InventoryUpdateRequest,
} from "../types/inventory";
import { applyInventoryMutation } from "../utils/inventory-mutation";
import {
  assertHouseholdSecret,
  canSaveToGitHub,
  fetchJsonFile,
  fetchJsonFromRepo,
  isGitHubConfigured,
  putJsonFile,
} from "./github-contents";

const INVENTORY_PATH = "data/inventory.json";

export async function fetchInventory(): Promise<Inventory> {
  return fetchJsonFromRepo<Inventory>(INVENTORY_PATH);
}

async function fetchInventoryFile(): Promise<{ sha: string; inventory: Inventory }> {
  const { sha, data } = await fetchJsonFile<Inventory>(INVENTORY_PATH);
  return { sha, inventory: data };
}

export async function saveInventoryUpdate(
  request: InventoryUpdateRequest,
): Promise<Inventory> {
  if (!isGitHubConfigured()) {
    throw new Error("Cannot save: GitHub repository is not configured");
  }

  assertHouseholdSecret(request.secret);

  const { sha, inventory } = await fetchInventoryFile();
  const updated = applyInventoryMutation(inventory, request.action, request.payload);
  const label =
    request.action === "delete"
      ? (request.payload as Pick<InventoryItem, "id">).id
      : (request.payload as InventoryItem).name;
  return putJsonFile(INVENTORY_PATH, updated, sha, `inventory: ${request.action} ${label}`);
}

export { canSaveToGitHub };

export function createEmptyItem(location: InventoryItem["location"]): InventoryItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    name: "",
    location,
    expirationDate: today,
    quantity: undefined,
    unit: "",
    notes: "",
    addedAt: new Date().toISOString(),
  };
}

export type { InventoryAction, InventoryItem };
