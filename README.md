# Fridge Monitor

A household web app to track fridge and freezer contents with expiration dates. Data lives in [`data/inventory.json`](data/inventory.json) and [`data/grocery.json`](data/grocery.json); the UI is a React SPA on GitHub Pages.

## Architecture

- **Read:** Loads both JSON files via the GitHub Contents API (always current; refetches when you return to the tab). Local dev falls back to mock JSON in `web/public/data/`.
- **Write:** Updates files via the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents) (~1–3s). The UI updates immediately (optimistic), then syncs in the background.
- **Grocery list:** Tap **Buy** on a fridge item or **Add item** on the grocery tab to add to the grocery list; check items off while shopping, then either **Check in bag** or **Clear checked**. The shopping bag tab can clear items or send them back into the fridge/freezer flow.
- **Add suggestions:** When adding an item, the name field suggests recent products from current inventory and `nameHistory` in `data/inventory.json` (kept after you remove an item, not shown in the list).
- **Deploy:** Pushes to `main` that touch `web/` run [Deploy to GitHub Pages](.github/workflows/deploy.yml).

## Live site

**https://cbfp-projects.github.io/fridge-monitor/**

## One-time setup

1. Repository: **https://github.com/cbfp-projects/fridge-monitor** (public; GitHub Pages enabled with Actions).

2. **Repository secrets** (Settings → Secrets and variables → Actions):

   | Secret | Description |
   |--------|-------------|
   | `HOUSEHOLD_SECRET` | Household password (checked in the app before save) |
   | `CONTENTS_WRITE_TOKEN` | Fine-grained PAT for this repo with **Contents: Read and write** |

3. Install [`uv`](https://docs.astral.sh/uv/) (required for `uvx`, used by `.mcp.json`).

4. **Enable GitHub Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.

5. Push to `main` or run the Deploy workflow so the live bundle includes the secrets above.

6. Open the live site, enter the household password when adding items, and confirm saves complete (subtitle shows “Saving…” briefly).

## Local development

```bash
cd web
npm install
npm run dev
```

## MCP server dependency

This repository includes a Claude-compatible MCP config at `.mcp.json` for `recipe-mcp`.

- `https://github.com/suraj-yadav-aiml/recipe-mcp`
- pinned to commit `e4d946b3268b68940f5f0f76fceddb3a5852f069` (via `scripts/run_recipe_mcp.py`)

Prerequisites:

- `uv` installed and `uvx` on your PATH
- Python 3 available on your PATH

### How to use `recipe-mcp`

Once your MCP client loads `.mcp.json`, you should see:

- tools like `search_recipes`, `get_recipe_details`, `create_meal_plan`, `search_by_first_letter`, `get_random_recipe`
- resources under `recipes://...` (for example `recipes://cuisines`, `recipes://meal-plans`, `recipes://stats`)

Common prompts to try:

- “Search for 5 pasta recipes and summarize key ingredients.”
- “Create a 3-day meal plan using recipe IDs 52771, 52772, and 52773.”
- “Show recipe collection stats.”

Troubleshooting:

- `uvx: command not found`: install `uv` and restart your shell.
- MCP server fails to start: run `python scripts/validate_mcp.py` from repo root.
- Network failures: the launcher downloads pinned upstream source at startup; retry when network access is available.

Without `VITE_REPO_*` set, the app loads mock data from `web/public/data/inventory.json`.

To test saves against GitHub locally, copy `.env.example` to `.env.local`:

```bash
VITE_REPO_OWNER=cbfp-projects
VITE_REPO_NAME=fridge-monitor
VITE_DEFAULT_BRANCH=main
VITE_CONTENTS_TOKEN=ghp_...
VITE_HOUSEHOLD_SECRET=1985
```

## Security notes

- The repo is **public**: anyone can read `data/inventory.json` and the source code.
- The built app embeds `VITE_CONTENTS_TOKEN` and `VITE_HOUSEHOLD_SECRET` for client-side saves. Use a **fine-grained** PAT limited to **Contents** on this repository only, and rotate it if the bundle is exposed.
- The household password is a light guard for casual use, not strong authentication.

## Optional: manual workflow

[Update inventory](.github/workflows/update-inventory.yml) remains available for manual edits via Actions (backup path; the app no longer uses it).
