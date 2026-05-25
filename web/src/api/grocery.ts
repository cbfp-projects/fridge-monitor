import type { GroceryAction, GroceryItem, GroceryList, GroceryUpdateRequest } from "../types/grocery";
import { applyGroceryMutation } from "../utils/grocery-mutation";
import {
  fetchJsonFile,
  fetchJsonFromRepo,
  isGitHubConfigured,
  putJsonFile,
} from "./github-contents";

const GROCERY_PATH = "data/grocery.json";

export async function fetchGrocery(): Promise<GroceryList> {
  return fetchJsonFromRepo<GroceryList>(GROCERY_PATH);
}

async function fetchGroceryFile(): Promise<{ sha: string; grocery: GroceryList }> {
  const { sha, data } = await fetchJsonFile<GroceryList>(GROCERY_PATH);
  return { sha, grocery: data };
}

export async function saveGroceryUpdate(request: GroceryUpdateRequest): Promise<GroceryList> {
  if (!isGitHubConfigured()) {
    throw new Error("Cannot save: GitHub repository is not configured");
  }

  const { sha, grocery } = await fetchGroceryFile();
  const updated = applyGroceryMutation(grocery, request.action, request.payload);
  const label =
    request.action === "clearChecked" || request.action === "checkInBag"
      ? "checked items"
      : request.action === "removeBagItem"
        ? `bag ${(request.payload as Pick<GroceryItem, "id">).id}`
      : request.action === "toggle" || request.action === "delete"
        ? (request.payload as Pick<GroceryItem, "id">).id
        : (request.payload as GroceryItem).name;
  return putJsonFile(GROCERY_PATH, updated, sha, `grocery: ${request.action} ${label}`);
}

export type { GroceryAction, GroceryItem, GroceryList };
