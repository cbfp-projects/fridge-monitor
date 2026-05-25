import type {
  Inventory,
  InventoryAction,
  InventoryItem,
  InventoryUpdateRequest,
} from "../types/inventory";

const owner = import.meta.env.VITE_REPO_OWNER as string | undefined;
const repo = import.meta.env.VITE_REPO_NAME as string | undefined;
const branch = (import.meta.env.VITE_DEFAULT_BRANCH as string | undefined) ?? "main";
const dispatchToken = import.meta.env.VITE_DISPATCH_TOKEN as string | undefined;

const WORKFLOW_FILE = "update-inventory.yml";

function isGitHubConfigured(): boolean {
  return Boolean(owner && repo);
}

function rawInventoryUrl(): string {
  if (!owner || !repo) {
    return `${import.meta.env.BASE_URL}data/inventory.json`;
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/inventory.json`;
}

export async function fetchInventory(): Promise<Inventory> {
  const url = `${rawInventoryUrl()}?t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load inventory (${res.status})`);
  }
  return res.json() as Promise<Inventory>;
}

function apiBase(): string {
  if (!owner || !repo) {
    throw new Error("GitHub repository is not configured");
  }
  return `https://api.github.com/repos/${owner}/${repo}`;
}

function authHeaders(): HeadersInit {
  if (!dispatchToken) {
    throw new Error("Dispatch token is not configured");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${dispatchToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function dispatchInventoryUpdate(
  request: InventoryUpdateRequest,
): Promise<void> {
  if (!isGitHubConfigured()) {
    throw new Error("Cannot save: GitHub repository is not configured");
  }

  const res = await fetch(
    `${apiBase()}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        ref: branch,
        inputs: {
          secret: request.secret,
          action: request.action,
          payload: JSON.stringify(request.payload),
        },
      }),
    },
  );

  if (res.status === 204) return;

  const body = await res.text();
  if (res.status === 401 || res.status === 403) {
    throw new Error("Save failed: invalid dispatch token or permissions");
  }
  throw new Error(`Save failed (${res.status}): ${body || res.statusText}`);
}

export type WorkflowRunStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "waiting"
  | "requested"
  | "pending";

interface WorkflowRun {
  id: number;
  status: WorkflowRunStatus;
  conclusion: string | null;
  created_at: string;
}

export async function waitForLatestWorkflowRun(
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<"success" | "failure" | "timeout"> {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const pollMs = options.pollMs ?? 2_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const run = await fetchLatestWorkflowRun();
    if (run) {
      if (run.status === "completed") {
        return run.conclusion === "success" ? "success" : "failure";
      }
    }
    await sleep(pollMs);
  }
  return "timeout";
}

async function fetchLatestWorkflowRun(): Promise<WorkflowRun | null> {
  const res = await fetch(
    `${apiBase()}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`,
    { headers: authHeaders() },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { workflow_runs: WorkflowRun[] };
  return data.workflow_runs[0] ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function canSaveToGitHub(): boolean {
  return isGitHubConfigured() && Boolean(dispatchToken);
}

export function createEmptyItem(location: InventoryItem["location"]): InventoryItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    name: "",
    location,
    expirationDate: today,
    quantity: undefined,
    unit: "",
    notes: "",
    addedAt: new Date().toISOString(),
  };
}

export type { InventoryAction, InventoryItem };
