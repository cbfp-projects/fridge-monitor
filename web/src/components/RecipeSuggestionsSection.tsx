import type { RecipeMatch, RecipeSuggestionTier, RecipeSuggestions } from "../types/recipe";

interface RecipeSuggestionsSectionProps {
  loading: boolean;
  error: string | null;
  suggestions: RecipeSuggestions;
  onAddMissing: (match: RecipeMatch) => void;
}

const TIER_CONFIG: Array<{ key: RecipeSuggestionTier; title: string }> = [
  { key: "canMakeNow", title: "Can make now" },
  { key: "missingFew", title: "Missing 1–2 items" },
  { key: "needsShopping", title: "Needs shopping" },
];

function ingredientLabel(match: RecipeMatch): string {
  const total = match.recipe.ingredients.length;
  const available = match.availableIngredients.length;
  if (match.missingIngredients.length === 0) {
    return `${available}/${total} ingredients available`;
  }
  return `${available}/${total} available · ${match.missingIngredients.length} missing`;
}

function missingLabel(match: RecipeMatch): string {
  return match.missingIngredients
    .map((ingredient) => {
      if (ingredient.quantity == null) return ingredient.name;
      const unit = ingredient.unit ? ` ${ingredient.unit}` : "";
      return `${ingredient.name} (${ingredient.quantity}${unit})`;
    })
    .join(", ");
}

export function RecipeSuggestionsSection({
  loading,
  error,
  suggestions,
  onAddMissing,
}: RecipeSuggestionsSectionProps) {
  const totalSuggestions =
    suggestions.canMakeNow.length + suggestions.missingFew.length + suggestions.needsShopping.length;

  return (
    <section className="recipe-suggestions" aria-label="Recipe suggestions">
      <h2 className="recipe-suggestions-title">Recipe suggestions</h2>
      {loading && <p className="state-message">Loading recipes…</p>}
      {!loading && error && (
        <p className="state-message state-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && totalSuggestions === 0 && (
        <p className="state-message state-empty">No recipe suggestions yet. Add more fridge items.</p>
      )}

      {!loading && !error && totalSuggestions > 0 && (
        <div className="recipe-tier-list">
          {TIER_CONFIG.map((tier) => {
            const matches = suggestions[tier.key];
            if (matches.length === 0) return null;

            return (
              <div key={tier.key} className="recipe-tier-group">
                <h3 className="grocery-section-label">{tier.title}</h3>
                <ul className="item-list">
                  {matches.map((match) => (
                    <li key={match.recipe.id}>
                      <article className="item-card recipe-card">
                        <div className="item-card-header">
                          <h4 className="item-name">{match.recipe.name}</h4>
                          {match.expiringSoonMatches > 0 && (
                            <span className="badge badge-warning">
                              Uses {match.expiringSoonMatches} expiring soon
                            </span>
                          )}
                        </div>
                        <p className="item-notes">{ingredientLabel(match)}</p>
                        {match.missingIngredients.length > 0 && (
                          <>
                            <p className="item-notes recipe-missing-list">Missing: {missingLabel(match)}</p>
                            <button
                              type="button"
                              className="btn btn-action"
                              onClick={() => onAddMissing(match)}
                            >
                              Add missing to grocery
                            </button>
                          </>
                        )}
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
