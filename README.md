# Fridge Monitor

A household web app to track fridge and freezer contents with expiration dates. Data lives in [`data/inventory.json`](data/inventory.json) and [`data/grocery.json`](data/grocery.json); the UI is a React SPA on GitHub Pages.

## Architecture

- **Read:** Loads both JSON files via the GitHub Contents API (always current; refetches when you return to the tab). Local dev falls back to mock JSON in `web/public/data/`.
- **Write:** Updates files via the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents) (~1–3s). The UI updates immediately (optimistic), then syncs in the background.
- **Grocery list:** Tap **Buy** on a fridge item or **Add item** on the grocery tab to add to the grocery list; check items off while shopping, then **Clear checked**.
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

3. **Enable GitHub Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.

4. Push to `main` or run the Deploy workflow so the live bundle includes the secrets above.

5. Open the live site, enter the household password when adding items, and confirm saves complete (subtitle shows “Saving…” briefly).

## Local development

```bash
cd web
npm install
npm run dev
```

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
