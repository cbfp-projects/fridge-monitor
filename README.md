# Fridge Monitor

A household web app to track fridge and freezer contents with expiration dates. Inventory lives in [`data/inventory.json`](data/inventory.json); the UI is a React SPA on GitHub Pages; updates run through GitHub Actions.

## Architecture

- **Read:** The app fetches `data/inventory.json` from raw GitHub (or local mock JSON in dev).
- **Write:** The app triggers the [Update inventory](.github/workflows/update-inventory.yml) workflow with a household password. The workflow validates the password, updates the JSON, and commits.
- **Deploy:** Pushes to `main` that touch `web/` run [Deploy to GitHub Pages](.github/workflows/deploy.yml).

## Live site

**https://cbfp-projects.github.io/fridge-monitor/**

## One-time setup

1. Repository: **https://github.com/cbfp-projects/fridge-monitor** (public; GitHub Pages enabled with Actions).

2. **Repository secrets** (Settings → Secrets and variables → Actions):
   | Secret | Description |
   |--------|-------------|
   | `HOUSEHOLD_SECRET` | Shared password your household uses in the app |
   | `WORKFLOW_DISPATCH_TOKEN` | Fine-grained PAT scoped to this repo with **Actions: Read and write** |

3. **Enable GitHub Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.

4. **Push to `main`** (or run the Deploy workflow) and confirm the Deploy workflow succeeds.

5. Open the live site, enter the household password when adding items, and verify the Update inventory workflow runs and commits.

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
VITE_DISPATCH_TOKEN=ghp_...
```

## Security notes

- The repo is **public**: anyone can read `data/inventory.json` and the source code.
- The dispatch token is embedded in the built JavaScript bundle. Use a **fine-grained** PAT limited to Actions on this repository and rotate it if exposed.
- `HOUSEHOLD_SECRET` stays in GitHub Actions secrets only; the workflow rejects writes without it.
- Choose a strong household password; the dispatch token alone cannot change inventory.

## Manual workflow test

In GitHub → Actions → **Update inventory** → Run workflow:

- **secret:** your `HOUSEHOLD_SECRET`
- **action:** `add`
- **payload:** `{"id":"<uuid>","name":"Test","location":"fridge","expirationDate":"2026-06-01","addedAt":"2026-05-24T12:00:00Z"}`
