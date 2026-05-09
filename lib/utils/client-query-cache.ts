"use client";

type Entry<T> = {
  value: T;
  updatedAt: number;
};

const QUERY_CACHE = new Map<string, Entry<unknown>>();

export function hasCachedValue(key: string): boolean {
  return QUERY_CACHE.has(key);
}

export async function getOrFetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  const force = Boolean(options?.force);
  if (!force) {
    const hit = QUERY_CACHE.get(key);
    if (hit) return hit.value as T;
  }
  const fresh = await fetcher();
  QUERY_CACHE.set(key, { value: fresh as unknown, updatedAt: Date.now() });
  return fresh;
}

export function setCachedValue<T>(key: string, value: T) {
  QUERY_CACHE.set(key, { value: value as unknown, updatedAt: Date.now() });
}

export function deleteCacheByPrefix(prefix: string) {
  for (const key of QUERY_CACHE.keys()) {
    if (key.startsWith(prefix)) QUERY_CACHE.delete(key);
  }
}

export function clearAllQueryCache() {
  QUERY_CACHE.clear();
}

export type FetchResponseCacheEntry = {
  bodyText: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

export function clearFetchResponseCache() {
  if (typeof window === "undefined") return;
  try {
    const g = window as typeof window & { __manageUtcFetchCache?: Map<string, FetchResponseCacheEntry> };
    g.__manageUtcFetchCache?.clear();
  } catch {
    // ignore
  }
}

/** RAM-only query cache + in-memory GET fetch cache — gọi khi đăng xuất / sau mutation có reload. */
export function clearAllClientCaches() {
  clearAllQueryCache();
  clearFetchResponseCache();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("manage_utc:query_cache_v1");
      localStorage.removeItem("manage_utc:fetch_cache_v1");
    } catch {
      // ignore
    }
  }
}
