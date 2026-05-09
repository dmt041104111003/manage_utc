"use client";

type Entry<T> = {
  value: T;
  updatedAt: number;
};

const QUERY_CACHE = new Map<string, Entry<unknown>>();
const QUERY_STORAGE_KEY = "manage_utc:query_cache_v1";
const FETCH_STORAGE_KEY = "manage_utc:fetch_cache_v1";

let queryStorageHydrated = false;
let persistQueryTimer: ReturnType<typeof setTimeout> | null = null;

function ensureQueryHydrated() {
  if (typeof window === "undefined" || queryStorageHydrated) return;
  queryStorageHydrated = true;
  try {
    const raw = localStorage.getItem(QUERY_STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, Entry<unknown>>;
    for (const [k, v] of Object.entries(obj)) {
      QUERY_CACHE.set(k, v);
    }
  } catch {
    // ignore corrupt storage
  }
}

function persistQueryCacheSync() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, Entry<unknown>> = {};
    for (const [k, v] of QUERY_CACHE.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // quota or serialization
  }
}

function schedulePersistQueryCache() {
  if (typeof window === "undefined") return;
  if (persistQueryTimer) clearTimeout(persistQueryTimer);
  persistQueryTimer = setTimeout(() => {
    persistQueryTimer = null;
    persistQueryCacheSync();
  }, 150);
}

export type FetchResponseCacheEntry = {
  bodyText: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

export function hasCachedValue(key: string): boolean {
  ensureQueryHydrated();
  return QUERY_CACHE.has(key);
}

export async function getOrFetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  ensureQueryHydrated();
  const force = Boolean(options?.force);
  if (!force) {
    const hit = QUERY_CACHE.get(key);
    if (hit) return hit.value as T;
  }
  const fresh = await fetcher();
  QUERY_CACHE.set(key, { value: fresh as unknown, updatedAt: Date.now() });
  schedulePersistQueryCache();
  return fresh;
}

export function setCachedValue<T>(key: string, value: T) {
  ensureQueryHydrated();
  QUERY_CACHE.set(key, { value: value as unknown, updatedAt: Date.now() });
  schedulePersistQueryCache();
}

export function deleteCacheByPrefix(prefix: string) {
  ensureQueryHydrated();
  let removed = false;
  for (const key of QUERY_CACHE.keys()) {
    if (key.startsWith(prefix)) {
      QUERY_CACHE.delete(key);
      removed = true;
    }
  }
  if (removed) schedulePersistQueryCache();
}

export function clearAllQueryCache() {
  ensureQueryHydrated();
  QUERY_CACHE.clear();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(QUERY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/** GET response cache used by DashboardShell fetch patch — persisted across sessions. */
export function restoreFetchResponseCache(map: Map<string, FetchResponseCacheEntry>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FETCH_STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, FetchResponseCacheEntry>;
    for (const [k, v] of Object.entries(obj)) {
      map.set(k, v);
    }
  } catch {
    // ignore
  }
}

let persistFetchTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePersistFetchResponseCache(map: Map<string, FetchResponseCacheEntry>) {
  if (typeof window === "undefined") return;
  if (persistFetchTimer) clearTimeout(persistFetchTimer);
  persistFetchTimer = setTimeout(() => {
    persistFetchTimer = null;
    persistFetchResponseCacheSync(map);
  }, 150);
}

function persistFetchResponseCacheSync(map: Map<string, FetchResponseCacheEntry>) {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, FetchResponseCacheEntry> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(FETCH_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // quota
  }
}

export function clearFetchResponseCache() {
  if (typeof window === "undefined") return;
  try {
    const g = window as typeof window & { __manageUtcFetchCache?: Map<string, FetchResponseCacheEntry> };
    g.__manageUtcFetchCache?.clear();
    localStorage.removeItem(FETCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Query cache + persisted GET fetch cache — call on logout only. */
export function clearAllClientCaches() {
  clearAllQueryCache();
  clearFetchResponseCache();
}
