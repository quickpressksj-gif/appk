import { useEffect, useState } from "react";

/**
 * Small async loader used across rider screens so every screen shows the same
 * skeleton-then-fade-in behaviour as the customer and partner apps.
 */
export function useRiderResource<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    void loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err : new Error("Request failed"));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading: data === null && error === null, setData };
}
