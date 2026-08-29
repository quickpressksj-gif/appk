const riderCache = new Map<string, any>();

export function setRiderResourceCache<T>(key: string, data: T) {
  riderCache.set(key, data);
}

export function getRiderResourceCache<T>(key: string): T | undefined {
  return riderCache.get(key);
}

/**
 * High-speed async loader with instant cache-first return for 0ms transitions.
 */
export function useRiderResource<T>(loader: () => Promise<T>, deps: unknown[] = [], cacheKey?: string) {
  const effectiveKey = cacheKey || (deps.length > 0 ? JSON.stringify(deps) : undefined);
  const cached = effectiveKey ? riderCache.get(effectiveKey) : undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    if (effectiveKey && riderCache.has(effectiveKey)) {
      setData(riderCache.get(effectiveKey));
    }
    void loader()
      .then((value) => {
        if (!active) return;
        if (effectiveKey) riderCache.set(effectiveKey, value);
        setData(value);
      })
      .catch((err: unknown) => {
        if (active && !cached) setError(err instanceof Error ? err : new Error("Request failed"));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading: data === null && error === null, setData };
}
