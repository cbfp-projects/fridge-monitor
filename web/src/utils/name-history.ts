import type { InventoryItem, NameHistoryEntry } from "../types/inventory";

export const NAME_HISTORY_MAX = 40;

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

export function itemToNameHistoryEntry(item: InventoryItem, lastUsedAt: string): NameHistoryEntry {
  return {
    name: item.name.trim(),
    location: item.location,
    quantity: item.quantity,
    unit: item.unit?.trim() || undefined,
    lastUsedAt,
  };
}

export function upsertNameHistory(
  history: NameHistoryEntry[],
  source: InventoryItem | NameHistoryEntry,
  lastUsedAt: string,
): NameHistoryEntry[] {
  const entry =
    "addedAt" in source
      ? itemToNameHistoryEntry(source, lastUsedAt)
      : { ...source, name: source.name.trim(), lastUsedAt };

  const key = normalizeItemName(entry.name);
  if (!key) return history;

  const next = history.filter((h) => normalizeItemName(h.name) !== key);
  next.push(entry);
  next.sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  return next.slice(0, NAME_HISTORY_MAX);
}
