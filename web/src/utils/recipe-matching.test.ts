import { describe, expect, it } from "vitest";
import type { InventoryItem } from "../types/inventory";
import type { Recipe } from "../types/recipe";
import { buildRecipeSuggestions } from "./recipe-matching";

const inventory: InventoryItem[] = [
  {
    id: "1",
    name: "Eggs",
    location: "fridge",
    expirationDate: "2099-01-01",
    quantity: 12,
    unit: "pieces",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Whole milk",
    location: "fridge",
    expirationDate: "2099-01-01",
    quantity: 1,
    unit: "quart",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
];

const recipes: Recipe[] = [
  {
    id: "omelet",
    name: "Omelet",
    ingredients: [{ name: "Egg" }, { name: "Milk" }],
  },
  {
    id: "pasta",
    name: "Pasta",
    ingredients: [{ name: "Pasta" }, { name: "Tomato" }, { name: "Onion" }],
  },
  {
    id: "toast",
    name: "French Toast",
    ingredients: [{ name: "Eggs" }, { name: "Bread" }, { name: "Milk" }],
  },
];

describe("buildRecipeSuggestions", () => {
  it("groups recipes into tier buckets", () => {
    const suggestions = buildRecipeSuggestions(recipes, inventory);

    expect(suggestions.canMakeNow.map((r) => r.recipe.id)).toEqual(["omelet"]);
    expect(suggestions.missingFew.map((r) => r.recipe.id)).toEqual(["toast"]);
    expect(suggestions.needsShopping.map((r) => r.recipe.id)).toEqual(["pasta"]);
  });
});
