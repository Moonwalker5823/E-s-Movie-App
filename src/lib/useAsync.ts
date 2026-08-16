import { useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string; // "" when fine
}

/** Run an async fetch tied to a component's lifetime: re-runs when `deps` change, ignores
 *  results from a superseded run (so a fast week-flip can't render stale data), and keeps
 *  the previous value on screen while refetching instead of flashing a spinner. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: enabled, error: "" });

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: "" }))
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: e?.message || "Request failed." })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return state;
}
