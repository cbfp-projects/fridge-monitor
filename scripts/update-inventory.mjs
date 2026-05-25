import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inventoryPath = join(__dirname, "..", "data", "inventory.json");

const action = process.env.INVENTORY_ACTION;
const payloadRaw = process.env.INVENTORY_PAYLOAD;

if (!action || !payloadRaw) {
  console.error("INVENTORY_ACTION and INVENTORY_PAYLOAD are required");
  process.exit(1);
}

/** @type {Record<string, unknown>} */
let payload;
try {
  payload = JSON.parse(payloadRaw);
} catch {
  console.error("INVENTORY_PAYLOAD must be valid JSON");
  process.exit(1);
}

/** @type {{ version: number; updatedAt: string; items: Array<Record<string, unknown>> }} */
let data;
try {
  data = JSON.parse(readFileSync(inventoryPath, "utf8"));
} catch (err) {
  console.error("Failed to read inventory:", err);
  process.exit(1);
}

if (!Array.isArray(data.items)) {
  data.items = [];
}
if (!Array.isArray(data.nameHistory)) {
  data.nameHistory = [];
}

const NAME_HISTORY_MAX = 40;
const now = new Date().toISOString();

function normalizeName(name) {
  return String(name).trim().toLowerCase();
}

function itemToHistoryEntry(item, lastUsedAt) {
  const unit = item.unit != null ? String(item.unit).trim() : "";
  return {
    name: String(item.name).trim(),
    location: item.location,
    quantity: item.quantity,
    unit: unit || undefined,
    lastUsedAt,
  };
}

function upsertNameHistory(history, item, lastUsedAt) {
  const entry = itemToHistoryEntry(item, lastUsedAt);
  const key = normalizeName(entry.name);
  if (!key) return history;
  const next = history.filter((h) => normalizeName(h.name) !== key);
  next.push(entry);
  next.sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  return next.slice(0, NAME_HISTORY_MAX);
}

switch (action) {
  case "add": {
    if (!payload.id || !payload.name || !payload.location || !payload.expirationDate) {
      console.error("add requires id, name, location, expirationDate");
      process.exit(1);
    }
    if (data.items.some((i) => i.id === payload.id)) {
      console.error(`duplicate id: ${payload.id}`);
      process.exit(1);
    }
    const saved = {
      ...payload,
      addedAt: payload.addedAt ?? now,
    };
    data.items.push(saved);
    data.nameHistory = upsertNameHistory(data.nameHistory, saved, now);
    break;
  }
  case "update": {
    if (!payload.id) {
      console.error("update requires id");
      process.exit(1);
    }
    const idx = data.items.findIndex((i) => i.id === payload.id);
    if (idx === -1) {
      console.error(`item not found: ${payload.id}`);
      process.exit(1);
    }
    const saved = { ...data.items[idx], ...payload };
    data.items[idx] = saved;
    data.nameHistory = upsertNameHistory(data.nameHistory, saved, now);
    break;
  }
  case "delete": {
    if (!payload.id) {
      console.error("delete requires id");
      process.exit(1);
    }
    const removed = data.items.find((i) => i.id === payload.id);
    if (!removed) {
      console.error(`item not found: ${payload.id}`);
      process.exit(1);
    }
    data.nameHistory = upsertNameHistory(data.nameHistory, removed, now);
    data.items = data.items.filter((i) => i.id !== payload.id);
    break;
  }
  default:
    console.error(`unknown action: ${action}`);
    process.exit(1);
}

data.updatedAt = now;
writeFileSync(inventoryPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`inventory ${action} ok (${data.items.length} items)`);
