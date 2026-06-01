const SYNONYMS: Record<string, string> = {
  eggs: "egg",
  egg: "egg",
  milk: "milk",
  "whole milk": "milk",
  "2% milk": "milk",
  "skim milk": "milk",
  yogurt: "yogurt",
  yogurts: "yogurt",
  "greek yogurt": "yogurt",
  "bell pepper": "pepper",
  "bell peppers": "pepper",
  peppers: "pepper",
  tomatoes: "tomato",
  potatoes: "potato",
  onions: "onion",
  scallions: "green onion",
  cilantro: "coriander",
  coriander: "coriander",
};

function singularizeWord(word: string): string {
  if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses") || word.endsWith("shes") || word.endsWith("ches")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

export function normalizeIngredientName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (SYNONYMS[cleaned]) return SYNONYMS[cleaned];

  const singularPhrase = cleaned
    .split(" ")
    .map((part) => singularizeWord(part))
    .join(" ");

  return SYNONYMS[singularPhrase] ?? singularPhrase;
}
