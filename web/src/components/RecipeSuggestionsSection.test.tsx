import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RecipeSuggestions } from "../types/recipe";
import { RecipeSuggestionsSection } from "./RecipeSuggestionsSection";

const emptySuggestions: RecipeSuggestions = {
  canMakeNow: [],
  missingFew: [],
  needsShopping: [],
};

describe("RecipeSuggestionsSection", () => {
  it("renders empty inventory style state", () => {
    render(
      <RecipeSuggestionsSection
        loading={false}
        error={null}
        suggestions={emptySuggestions}
        onAddMissing={vi.fn()}
      />,
    );

    expect(screen.getByText("No recipe suggestions yet. Add more fridge items.")).toBeInTheDocument();
  });

  it("renders no matches state for recipe load error", () => {
    render(
      <RecipeSuggestionsSection
        loading={false}
        error="Failed to load recipes"
        suggestions={emptySuggestions}
        onAddMissing={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load recipes");
  });

  it("renders partial match tier with add button", () => {
    const suggestions: RecipeSuggestions = {
      canMakeNow: [],
      missingFew: [
        {
          recipe: {
            id: "toast",
            name: "French Toast",
            ingredients: [{ name: "Eggs" }, { name: "Bread" }, { name: "Milk" }],
          },
          availableIngredients: [{ name: "Eggs" }, { name: "Milk" }],
          missingIngredients: [{ name: "Bread", quantity: 1, unit: "loaf" }],
          expiringSoonMatches: 0,
          score: 12,
          tier: "missingFew",
        },
      ],
      needsShopping: [],
    };

    render(
      <RecipeSuggestionsSection
        loading={false}
        error={null}
        suggestions={suggestions}
        onAddMissing={vi.fn()}
      />,
    );

    expect(screen.getByText("Missing 1–2 items")).toBeInTheDocument();
    expect(screen.getByText("French Toast")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add missing to grocery" })).toBeInTheDocument();
  });
});
