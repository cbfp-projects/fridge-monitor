export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeBook {
  version: number;
  updatedAt: string;
  recipes: Recipe[];
}

export type RecipeSuggestionTier = "canMakeNow" | "missingFew" | "needsShopping";

export interface RecipeMatch {
  recipe: Recipe;
  availableIngredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  expiringSoonMatches: number;
  score: number;
  tier: RecipeSuggestionTier;
}

export interface RecipeSuggestions {
  canMakeNow: RecipeMatch[];
  missingFew: RecipeMatch[];
  needsShopping: RecipeMatch[];
}
