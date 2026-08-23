import { useEffect, useRef, useState } from "react";

const memoryCache = new Map<string, unknown>();

/**
 * High-performance SWR (Stale-While-Revalidate) loader used across partner screens.
 * Returns cached data immediately for zero-lag page navigation and refreshes
 * seamlessly in the background.
 */
export function usePartnerResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  cacheKey?: string,
) {
  const key = cacheKey || loader.name || loader.toString().slice(0, 40);
  const initial = (memoryCache.get(key) as T) ?? null;
  const [data, setData] = useState<T | null>(initial);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cached = memoryCache.get(key) as T | undefined;
    if (cached !== undefined) {
      setData(cached);
    }

    setIsValidating(true);
    loader()
      .then((value) => {
        if (!isMounted.current) return;
        memoryCache.set(key, value);
        setData(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted.current) return;
        // Keep stale data if available on network error
        if (memoryCache.has(key)) {
          setData(memoryCache.get(key) as T);
        } else {
          setError(err instanceof Error ? err : new Error("Request failed"));
        }
      })
      .finally(() => {
        if (isMounted.current) setIsValidating(false);
      });

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);

  const updateData = (newData: T | ((prev: T | null) => T | null)) => {
    setData((prev) => {
      const resolved = typeof newData === "function" ? (newData as (p: T | null) => T | null)(prev) : newData;
      if (resolved !== null) {
        memoryCache.set(key, resolved);
      }
      return resolved;
    });
  };

  return {
    data,
    error,
    isLoading: data === null && error === null,
    isValidating,
    setData: updateData,
  };
}
