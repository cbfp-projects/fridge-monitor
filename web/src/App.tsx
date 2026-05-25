import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchGrocery, saveGroceryUpdate } from "./api/grocery";
import {
  canSaveToGitHub,
  createEmptyItem,
  fetchInventory,
  saveInventoryUpdate,
} from "./api/inventory";
import { AddItemBar } from "./components/AddItemBar";
import { AppHeader } from "./components/AppHeader";
import { FridgeIcon } from "./components/FridgeIcon";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { GroceryItemFormModal } from "./components/GroceryItemFormModal";
import { GroceryView } from "./components/GroceryView";
import { ItemCard } from "./components/ItemCard";
import { ItemFormModal } from "./components/ItemFormModal";
import type { AppScreen } from "./types/app";
import type { GroceryItem, GroceryList } from "./types/grocery";
import type { Inventory, InventoryAction, InventoryItem, LocationFilter } from "./types/inventory";
import { applyGroceryMutation, createGroceryItem, groceryItemFromInventory } from "./utils/grocery-mutation";
import { applyInventoryMutation } from "./utils/inventory-mutation";
import { formatDateTime } from "./utils/expiry";
import "./App.css";
import "./fridge-theme.css";

type FormMode = "add" | "edit" | null;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("fridge");
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [grocery, setGrocery] = useState<GroceryList | null>(null);
  const [filter, setFilter] = useState<LocationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [groceryFormOpen, setGroceryFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = canSaveToGitHub();
  const syncingRef = useRef(false);
  const savingRef = useRef(false);
  useEffect(() => {
    syncingRef.current = syncing;
    savingRef.current = saving;
  }, [syncing, saving]);

  const load = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    if (!background) setError(null);
    try {
      const [inv, gro] = await Promise.all([fetchInventory(), fetchGrocery()]);
      setInventory(inv);
      setGrocery(gro);
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      if (background) {
        setSyncError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void load();
  }, [load]);

  useEffect(() => {
    function refetchIfVisible() {
      if (document.visibilityState !== "visible") return;
      if (syncingRef.current || savingRef.current) return;
      void load({ background: true });
    }

    document.addEventListener("visibilitychange", refetchIfVisible);
    window.addEventListener("pageshow", refetchIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refetchIfVisible);
      window.removeEventListener("pageshow", refetchIfVisible);
    };
  }, [load]);

  const grocerySourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of grocery?.items ?? []) {
      if (g.sourceItemId) ids.add(g.sourceItemId);
    }
    return ids;
  }, [grocery]);

  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    const items =
      filter === "all"
        ? inventory.items
        : inventory.items.filter((i) => i.location === filter);
    return [...items].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }, [inventory, filter]);

  const counts = useMemo(() => {
    const items = inventory?.items ?? [];
    return {
      all: items.length,
      fridge: items.filter((i) => i.location === "fridge").length,
      freezer: items.filter((i) => i.location === "freezer").length,
    };
  }, [inventory]);

  const subtitle = useMemo(() => {
    if (syncing) return "Saving…";
    if (screen === "grocery" && grocery) {
      const n = grocery.items.filter((i) => !i.checked).length;
      return `Updated ${formatDateTime(grocery.updatedAt)} · ${n} to buy`;
    }
    if (inventory) {
      return `Updated ${formatDateTime(inventory.updatedAt)}`;
    }
    return null;
  }, [screen, inventory, grocery, syncing]);

  function openAddInventory() {
    setSaveError(null);
    setEditingItem(createEmptyItem(filter === "freezer" ? "freezer" : "fridge"));
    setFormMode("add");
  }

  function openAddGrocery() {
    setSaveError(null);
    setGroceryFormOpen(true);
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

  function closeGroceryForm() {
    setGroceryFormOpen(false);
    setSaveError(null);
  }

  async function persistGrocery(
    action: Parameters<typeof applyGroceryMutation>[1],
    payload: Parameters<typeof applyGroceryMutation>[2],
    optimistic: (prev: GroceryList) => GroceryList,
  ) {
    if (!grocery) return;

    const snapshot = grocery;
    let next: GroceryList;
    try {
      next = optimistic(snapshot);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Update failed");
      return;
    }

    setGrocery(next);
    setSyncError(null);
    setSyncing(true);

    try {
      const saved = await saveGroceryUpdate({ action, payload });
      setGrocery(saved);
    } catch (err) {
      setGrocery(snapshot);
      setSyncError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleBuy(item: InventoryItem) {
    if (grocerySourceIds.has(item.id)) return;
    const entry = groceryItemFromInventory(item);
    await persistGrocery("add", entry, (prev) => applyGroceryMutation(prev, "add", entry));
  }

  async function handleGroceryAdd(item: Pick<GroceryItem, "name" | "quantity" | "unit">) {
    if (!grocery) {
      setSyncError("Failed to load grocery list");
      return;
    }
    closeGroceryForm();
    const entry = createGroceryItem(item);
    await persistGrocery("add", entry, (prev) => applyGroceryMutation(prev, "add", entry));
  }

  function handleGroceryToggle(item: { id: string }) {
    void persistGrocery("toggle", { id: item.id }, (prev) =>
      applyGroceryMutation(prev, "toggle", { id: item.id }),
    );
  }

  function handleGroceryClearChecked() {
    void persistGrocery("clearChecked", { id: "" }, (prev) =>
      applyGroceryMutation(prev, "clearChecked", { id: "" }),
    );
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

  const showFooter = (screen === "fridge" || screen === "grocery") && !loading && !error;

  return (
    <div
      className={`app ${screen === "fridge" ? "app--fridge-screen" : ""} ${showFooter ? "app-with-footer" : ""}`}
    >
      <AppHeader
        screen={screen}
        onScreenChange={setScreen}
        subtitle={subtitle}
        refreshing={refreshing}
        onRefresh={() => load({ background: true })}
        groceryCount={grocery?.items.filter((i) => !i.checked).length ?? 0}
      />

      {syncError && (
        <p className="status-banner status-error" role="alert">
          {syncError}
        </p>
      )}

      {screen === "fridge" && (
        <div
          className="fridge-interior"
          data-location={filter}
          role="region"
          aria-label={
            filter === "freezer"
              ? "Freezer compartment"
              : filter === "fridge"
                ? "Refrigerator compartment"
                : "Refrigerator interior"
          }
        >
          <div className="fridge-door-gasket" aria-hidden="true" />
          <div className="fridge-led-bar" aria-hidden="true" />
          <nav className="tabs location-tabs" aria-label="Filter by location">
            {(["all", "fridge", "freezer"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab tab-${tab} ${filter === tab ? "tab-active" : ""}${tab !== "all" ? " tab--icon-only" : ""}`}
                onClick={() => setFilter(tab)}
                aria-label={tab === "fridge" ? "Fridge" : tab === "freezer" ? "Freezer" : undefined}
              >
                {tab === "freezer" && (
                  <span className="tab-icon tab-icon--glyph" aria-hidden>
                    ❄
                  </span>
                )}
                {tab === "fridge" && (
                  <span className="tab-icon tab-icon--svg" aria-hidden>
                    <FridgeIcon />
                  </span>
                )}
                {tab === "all" && "All"}
                <span className="tab-count">{counts[tab]}</span>
              </button>
            ))}
          </nav>

          <main className="main main-scroll">
            {loading && <p className="state-message">Loading inventory…</p>}
            {error && (
              <p className="state-message state-error" role="alert">
                {error}
              </p>
            )}
            {!loading && !error && filteredItems.length === 0 && (
              <p className="state-message state-empty">
                No items{filter !== "all" ? ` in the ${filter}` : ""}. Tap Add below to track something.
              </p>
            )}
            <ul className="item-list">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <ItemCard
                    item={item}
                    onBuy={handleBuy}
                    onEdit={openEdit}
                    onDelete={(i) => {
                      setSaveError(null);
                      setDeletingItem(i);
                    }}
                    onGroceryList={grocerySourceIds.has(item.id)}
                  />
                </li>
              ))}
            </ul>
          </main>

        </div>
      )}

      {showFooter && <AddItemBar onAdd={screen === "grocery" ? openAddGrocery : openAddInventory} />}

      {screen === "grocery" && (
        <main className="main main-scroll">
          <GroceryView
            grocery={grocery}
            loading={loading}
            onToggle={handleGroceryToggle}
            onClearChecked={handleGroceryClearChecked}
          />
        </main>
      )}

      <ItemFormModal
        key={formMode === "add" ? "add" : (editingItem?.id ?? "edit")}
        mode={formMode === "add" ? "add" : "edit"}
        item={editingItem ?? createEmptyItem("fridge")}
        inventory={inventory}
        open={formMode !== null}
        saving={saving}
        error={saveError}
        canSave={canSave}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      {groceryFormOpen && <GroceryItemFormModal onClose={closeGroceryForm} onSubmit={handleGroceryAdd} />}

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
