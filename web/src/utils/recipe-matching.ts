import type { InventoryItem } from "../types/inventory";
import type {
  Recipe,
  RecipeIngredient,
  RecipeMatch,
  RecipeSuggestionTier,
  RecipeSuggestions,
} from "../types/recipe";
import { daysUntil } from "./expiry";
import { normalizeIngredientName } from "./item-normalization";

interface MatchContext {
  byName: Map<string, InventoryItem[]>;
}

function buildInventoryIndex(items: InventoryItem[]): MatchContext {
  const byName = new Map<string, InventoryItem[]>();
  for (const item of items) {
    const key = normalizeIngredientName(item.name);
    if (!key) continue;
    const existing = byName.get(key) ?? [];
    existing.push(item);
    byName.set(key, existing);
  }
  return { byName };
}

function classifyTier(missingCount: number): RecipeSuggestionTier {
  if (missingCount === 0) return "canMakeNow";
  if (missingCount <= 2) return "missingFew";
  return "needsShopping";
}

function scoreMatch(
  availableCount: number,
  missingCount: number,
  expiringSoonMatches: number,
  ingredientCount: number,
): number {
  return availableCount * 12 - missingCount * 8 + expiringSoonMatches * 3 - ingredientCount;
}

function toRecipeMatch(recipe: Recipe, inventory: MatchContext): RecipeMatch {
  const availableIngredients: RecipeIngredient[] = [];
  const missingIngredients: RecipeIngredient[] = [];
  let expiringSoonMatches = 0;

  for (const ingredient of recipe.ingredients) {
    const key = normalizeIngredientName(ingredient.name);
    const matches = key ? inventory.byName.get(key) : undefined;
    if (matches && matches.length > 0) {
      availableIngredients.push(ingredient);
      if (matches.some((item) => daysUntil(item.expirationDate) <= 3)) {
        expiringSoonMatches += 1;
      }
    } else {
      missingIngredients.push(ingredient);
    }
  }

  const tier = classifyTier(missingIngredients.length);
  const score = scoreMatch(
    availableIngredients.length,
    missingIngredients.length,
    expiringSoonMatches,
    recipe.ingredients.length,
  );

  return {
    recipe,
    availableIngredients,
    missingIngredients,
    expiringSoonMatches,
    score,
    tier,
  };
}

function sortMatches(a: RecipeMatch, b: RecipeMatch): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.missingIngredients.length !== b.missingIngredients.length) {
    return a.missingIngredients.length - b.missingIngredients.length;
  }
  if (b.expiringSoonMatches !== a.expiringSoonMatches) {
    return b.expiringSoonMatches - a.expiringSoonMatches;
  }
  return a.recipe.name.localeCompare(b.recipe.name);
}

export function buildRecipeSuggestions(recipes: Recipe[], inventoryItems: InventoryItem[]): RecipeSuggestions {
  const indexed = buildInventoryIndex(inventoryItems);
  const matches = recipes.map((recipe) => toRecipeMatch(recipe, indexed));

  const suggestions: RecipeSuggestions = {
    canMakeNow: [],
    missingFew: [],
    needsShopping: [],
  };

  for (const match of matches.sort(sortMatches)) {
    suggestions[match.tier].push(match);
  }

  return suggestions;
}
