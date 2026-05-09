"use client";

type Entry<T> = {
  value: T;
  updatedAt: number;
};

const QUERY_CACHE = new Map<string, Entry<unknown>>();

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
