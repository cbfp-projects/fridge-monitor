import type {
  Inventory,
  InventoryAction,
  InventoryItem,
  InventoryUpdateRequest,
} from "../types/inventory";
import { applyInventoryMutation } from "../utils/inventory-mutation";

const owner = import.meta.env.VITE_REPO_OWNER as string | undefined;
const repo = import.meta.env.VITE_REPO_NAME as string | undefined;
const branch = (import.meta.env.VITE_DEFAULT_BRANCH as string | undefined) ?? "main";
const contentsToken = import.meta.env.VITE_CONTENTS_TOKEN as string | undefined;
const householdSecret = import.meta.env.VITE_HOUSEHOLD_SECRET as string | undefined;

const INVENTORY_PATH = "data/inventory.json";

function isGitHubConfigured(): boolean {
  return Boolean(owner && repo);
}

function rawInventoryUrl(): string {
  if (!owner || !repo) {
    return `${import.meta.env.BASE_URL}data/inventory.json`;
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${INVENTORY_PATH}`;
}

function apiBase(): string {
  if (!owner || !repo) {
    throw new Error("GitHub repository is not configured");
  }
  return `https://api.github.com/repos/${owner}/${repo}`;
}

function authHeaders(): HeadersInit {
  if (!contentsToken) {
    throw new Error("GitHub token is not configured");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${contentsToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function assertHouseholdSecret(secret: string): void {
  if (!householdSecret) {
    throw new Error("Household password is not configured for this build");
  }
  if (secret !== householdSecret) {
    throw new Error("Wrong household password");
  }
}

export async function fetchInventory(): Promise<Inventory> {
  const url = `${rawInventoryUrl()}?t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load inventory (${res.status})`);
  }
  return res.json() as Promise<Inventory>;
}

interface ContentsResponse {
  sha: string;
  content: string;
}

async function fetchInventoryFile(): Promise<{ sha: string; inventory: Inventory }> {
  const res = await fetch(
    `${apiBase()}/contents/${INVENTORY_PATH}?ref=${encodeURIComponent(branch)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error("Save failed: invalid token or missing Contents permission");
    }
    throw new Error(`Failed to read inventory file (${res.status}): ${body || res.statusText}`);
  }
  const data = (await res.json()) as ContentsResponse;
  const inventory = JSON.parse(base64ToUtf8(data.content)) as Inventory;
  return { sha: data.sha, inventory };
}

async function putInventoryFile(
  inventory: Inventory,
  sha: string,
  message: string,
): Promise<Inventory> {
  const body = `${JSON.stringify(inventory, null, 2)}\n`;
  const res = await fetch(`${apiBase()}/contents/${INVENTORY_PATH}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      content: utf8ToBase64(body),
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409) {
      throw new Error("Inventory changed elsewhere. Refresh and try again.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Save failed: invalid token or missing Contents permission");
    }
    throw new Error(`Save failed (${res.status}): ${text || res.statusText}`);
  }
  return inventory;
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
  return putInventoryFile(updated, sha, `inventory: ${request.action} ${label}`);
}

export function canSaveToGitHub(): boolean {
  return isGitHubConfigured() && Boolean(contentsToken) && Boolean(householdSecret);
}

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
