import { describe, expect, it } from "vitest";
import { normalizeIngredientName } from "./item-normalization";

describe("normalizeIngredientName", () => {
  it("normalizes plural forms", () => {
    expect(normalizeIngredientName("Tomatoes")).toBe("tomato");
    expect(normalizeIngredientName("EGGS")).toBe("egg");
  });

  it("normalizes synonyms", () => {
    expect(normalizeIngredientName("Whole milk")).toBe("milk");
    expect(normalizeIngredientName("Greek Yogurt")).toBe("yogurt");
  });
});
