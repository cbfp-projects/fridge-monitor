import { useCallback, useEffect, useMemo, useState } from "react";
import {
  canSaveToGitHub,
  createEmptyItem,
  fetchInventory,
  saveInventoryUpdate,
} from "./api/inventory";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { ItemCard } from "./components/ItemCard";
import { ItemFormModal } from "./components/ItemFormModal";
import type { Inventory, InventoryAction, InventoryItem, LocationFilter } from "./types/inventory";
import { applyInventoryMutation } from "./utils/inventory-mutation";
import { formatDateTime } from "./utils/expiry";
import "./App.css";

type FormMode = "add" | "edit" | null;

export default function App() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [filter, setFilter] = useState<LocationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = canSaveToGitHub();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchInventory();
      setInventory(data);
      setSyncError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- mount fetch
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    const items =
      filter === "all"
        ? inventory.items
        : inventory.items.filter((i) => i.location === filter);
    return [...items].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }, [inventory, filter]);

  function openAdd() {
    setSaveError(null);
    setEditingItem(createEmptyItem(filter === "freezer" ? "freezer" : "fridge"));
    setFormMode("add");
  }

  function openEdit(item: InventoryItem) {
    setSaveError(null);
    setEditingItem({ ...item });
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode(null);
    setEditingItem(null);
    setSaveError(null);
  }

  async function handleSave(
    secret: string,
    action: InventoryAction,
    item: InventoryItem,
  ) {
    if (!inventory) return;

    setSaving(true);
    setSaveError(null);
    setSyncError(null);

    const snapshot = inventory;
    let optimistic: Inventory;
    try {
      optimistic = applyInventoryMutation(snapshot, action, item);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Invalid item");
      setSaving(false);
      return;
    }

    setInventory(optimistic);
    closeForm();
    setDeletingItem(null);
    setSaving(false);
    setSyncing(true);

    try {
      const saved = await saveInventoryUpdate({ secret, action, payload: item });
      setInventory(saved);
    } catch (err) {
      setInventory(snapshot);
      const message = err instanceof Error ? err.message : "Save failed";
      setSyncError(message);
      if (message.toLowerCase().includes("password")) {
        setSaveError(message);
        if (action !== "delete") {
          setEditingItem(item);
          setFormMode(action === "add" ? "add" : "edit");
        } else {
          setDeletingItem(item);
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(secret: string, item: InventoryItem) {
    await handleSave(secret, "delete", item);
  }

  const counts = useMemo(() => {
    const items = inventory?.items ?? [];
    return {
      all: items.length,
      fridge: items.filter((i) => i.location === "fridge").length,
      freezer: items.filter((i) => i.location === "freezer").length,
    };
  }, [inventory]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Fridge Monitor</h1>
          {inventory && (
            <p className="subtitle">
              Updated {formatDateTime(inventory.updatedAt)}
              {syncing ? " · Saving…" : null}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => load(true)}
            disabled={refreshing || syncing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            + Add
          </button>
        </div>
      </header>

      {syncError && (
        <p className="status-banner status-error" role="alert">
          {syncError}
        </p>
      )}

      <nav className="tabs" aria-label="Filter by location">
        {(["all", "fridge", "freezer"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${filter === tab ? "tab-active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">{counts[tab]}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {loading && <p className="state-message">Loading inventory…</p>}
        {error && (
          <p className="state-message state-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && filteredItems.length === 0 && (
          <p className="state-message state-empty">
            No items{filter !== "all" ? ` in the ${filter}` : ""}. Tap Add to track something.
          </p>
        )}
        <ul className="item-list">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                onEdit={openEdit}
                onDelete={(i) => {
                  setSaveError(null);
                  setDeletingItem(i);
                }}
              />
            </li>
          ))}
        </ul>
      </main>

      <ItemFormModal
        key={formMode === "add" ? "add" : (editingItem?.id ?? "edit")}
        mode={formMode === "add" ? "add" : "edit"}
        item={editingItem ?? createEmptyItem("fridge")}
        open={formMode !== null}
        saving={saving}
        error={saveError}
        canSave={canSave}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      <DeleteConfirmModal
        item={deletingItem}
        open={deletingItem !== null}
        saving={saving}
        error={saveError}
        canSave={canSave}
        onClose={() => {
          setDeletingItem(null);
          setSaveError(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
