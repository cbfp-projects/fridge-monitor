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

const now = new Date().toISOString();

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
    data.items.push({
      ...payload,
      addedAt: payload.addedAt ?? now,
    });
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
    data.items[idx] = { ...data.items[idx], ...payload };
    break;
  }
  case "delete": {
    if (!payload.id) {
      console.error("delete requires id");
      process.exit(1);
    }
    const before = data.items.length;
    data.items = data.items.filter((i) => i.id !== payload.id);
    if (data.items.length === before) {
      console.error(`item not found: ${payload.id}`);
      process.exit(1);
    }
    break;
  }
  default:
    console.error(`unknown action: ${action}`);
    process.exit(1);
}

data.updatedAt = now;
writeFileSync(inventoryPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`inventory ${action} ok (${data.items.length} items)`);
