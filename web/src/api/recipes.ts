import type { RecipeBook } from "../types/recipe";
import { fetchJsonFromRepo } from "./github-contents";

const RECIPES_PATH = "data/recipes.json";

export async function fetchRecipes(): Promise<RecipeBook> {
  return fetchJsonFromRepo<RecipeBook>(RECIPES_PATH);
}
