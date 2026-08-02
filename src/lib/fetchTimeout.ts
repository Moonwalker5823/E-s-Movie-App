/** fetch with an abort timeout so a hung upstream can't leave the UI spinning forever.
 *  Rejects with AbortError on timeout — callers already catch and show an error/fallback.
 *  Uses AbortController (broadest Android-WebView support) rather than AbortSignal.timeout. */
export function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}
