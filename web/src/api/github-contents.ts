const owner = import.meta.env.VITE_REPO_OWNER as string | undefined;
const repo = import.meta.env.VITE_REPO_NAME as string | undefined;
const branch = (import.meta.env.VITE_DEFAULT_BRANCH as string | undefined) ?? "main";
const contentsToken = import.meta.env.VITE_CONTENTS_TOKEN as string | undefined;
const householdSecret = import.meta.env.VITE_HOUSEHOLD_SECRET as string | undefined;

export const noStore: RequestInit = { cache: "no-store" };

export function isGitHubConfigured(): boolean {
  return Boolean(owner && repo);
}

export function canSaveToGitHub(): boolean {
  return isGitHubConfigured() && Boolean(contentsToken) && Boolean(householdSecret);
}

export function getEmbeddedHouseholdSecret(): string {
  if (!householdSecret) {
    throw new Error("Household password is not configured for this build");
  }
  return householdSecret;
}

export function assertHouseholdSecret(secret: string): void {
  if (secret !== getEmbeddedHouseholdSecret()) {
    throw new Error("Wrong household password");
  }
}

export function localDataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

function apiBase(): string {
  if (!owner || !repo) {
    throw new Error("GitHub repository is not configured");
  }
  return `https://api.github.com/repos/${owner}/${repo}`;
}

function authHeaders(): HeadersInit {
  if (!contentsToken) {
    throw new Error("GitHub token is not configured");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${contentsToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

interface ContentsResponse {
  sha: string;
  content: string;
}

export async function fetchJsonFile<T>(path: string): Promise<{ sha: string; data: T }> {
  const res = await fetch(
    `${apiBase()}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { ...noStore, headers: authHeaders() },
  );
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Failed to load ${path}: invalid token or missing Contents permission`);
    }
    throw new Error(`Failed to read ${path} (${res.status}): ${body || res.statusText}`);
  }
  const raw = (await res.json()) as ContentsResponse;
  return { sha: raw.sha, data: JSON.parse(base64ToUtf8(raw.content)) as T };
}

export async function putJsonFile<T>(
  path: string,
  data: T,
  sha: string,
  message: string,
): Promise<T> {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  const res = await fetch(`${apiBase()}/contents/${path}`, {
    ...noStore,
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      content: utf8ToBase64(body),
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409) {
      throw new Error("Data changed elsewhere. Refresh and try again.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Save failed: invalid token or missing Contents permission");
    }
    throw new Error(`Save failed (${res.status}): ${text || res.statusText}`);
  }
  return data;
}

export async function fetchLocalJson<T>(path: string): Promise<T> {
  const url = `${localDataUrl(path)}?t=${Date.now()}`;
  const res = await fetch(url, noStore);
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchJsonFromRepo<T>(path: string): Promise<T> {
  if (isGitHubConfigured() && contentsToken) {
    const { data } = await fetchJsonFile<T>(path);
    return data;
  }
  return fetchLocalJson<T>(path);
}
