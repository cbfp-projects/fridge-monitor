import type { Inventory, NameHistoryEntry } from "../types/inventory";
import { itemToNameHistoryEntry, normalizeItemName } from "./name-history";

export function buildSuggestionEntries(inventory: Inventory): NameHistoryEntry[] {
  const now = inventory.updatedAt || new Date().toISOString();
  const fromItems = (inventory.items ?? []).map((item) =>
    itemToNameHistoryEntry(item, item.addedAt || now),
  );
  const fromHistory = inventory.nameHistory ?? [];
  const merged = [...fromItems, ...fromHistory];

  const byKey = new Map<string, NameHistoryEntry>();
  for (const entry of merged) {
    const key = normalizeItemName(entry.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || entry.lastUsedAt.localeCompare(existing.lastUsedAt) > 0) {
      byKey.set(key, entry);
    }
  }

  return [...byKey.values()].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
}

export function filterSuggestions(
  entries: NameHistoryEntry[],
  query: string,
  limit = 8,
): NameHistoryEntry[] {
  const q = query.trim().toLowerCase();
  const sorted = [...entries].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  if (!q) return sorted.slice(0, limit);
  return sorted
    .filter((e) => normalizeItemName(e.name).startsWith(q) || e.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function formatSuggestionMeta(entry: NameHistoryEntry): string {
  const parts: string[] = [entry.location];
  if (entry.quantity != null && !Number.isNaN(entry.quantity)) {
    const unit = entry.unit ? ` ${entry.unit}` : "";
    parts.push(`${entry.quantity}${unit}`);
  } else if (entry.unit) {
    parts.push(entry.unit);
  }
  return parts.join(" · ");
}
