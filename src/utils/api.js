/**
 * Thin fetch wrapper.
 *
 * Behaviour:
 *  - Injects Authorization: Bearer <jwt> when we have a valid token.
 *  - Injects X-Transaction-Id (already handled by the global fetch interceptor
 *    in transactionTracking.js, but we set it here too so the header is visible
 *    when consumers construct Request objects themselves).
 *  - Accepts `json` option → JSON.stringify + sets Content-Type.
 *  - On 401 → clears auth session. Caller decides whether to redirect.
 *  - Returns the raw Response (callers that want JSON can call .json()).
 *
 * Use this instead of raw fetch + manual withAuthHeader + manual tx-id wiring.
 */
import { clearAuthSession, getValidatedAuthToken } from './auth';
import { getOrCreateTransactionId } from './transactionTracking';

const buildHeaders = (input, { auth, hasJsonBody }) => {
  const headers = new Headers(input || {});

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (auth !== false) {
    const token = getValidatedAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!headers.has('X-Transaction-Id')) {
    headers.set('X-Transaction-Id', getOrCreateTransactionId());
  }

  return headers;
};

/**
 * apiFetch(url, { method, json, body, headers, auth, signal })
 *
 * @param {string} url
 * @param {object} [options]
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [options.method='GET']
 * @param {any}    [options.json]     plain object to be JSON.stringified
 * @param {BodyInit} [options.body]   raw body (takes precedence over json)
 * @param {HeadersInit} [options.headers]
 * @param {boolean} [options.auth=true]  set false to skip Authorization header
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Response>}
 */
export const apiFetch = async (url, options = {}) => {
  const { method = 'GET', json, body, headers, auth = true, signal } = options;

  const hasJsonBody = json !== undefined && body === undefined;
  const finalHeaders = buildHeaders(headers, { auth, hasJsonBody });
  const finalBody = hasJsonBody ? JSON.stringify(json) : body;

  // Apply a default network timeout so a hanging backend doesn't freeze the UI.
  // Callers can opt out by passing { timeoutMs: 0 } or providing their own signal.
  const timeoutMs = options.timeoutMs === undefined ? 15000 : options.timeoutMs;
  let effectiveSignal = signal;
  let timeoutHandle = null;
  if (!signal && timeoutMs > 0 && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    effectiveSignal = controller.signal;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: effectiveSignal
    });
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
};

/**
 * fetchWithTimeout(url, init, timeoutMs)
 *
 * Lightweight wrapper around the global fetch that aborts after `timeoutMs`.
 * Use this for raw fetch call sites that don't (yet) go through apiFetch.
 *
 * Throws a DOMException("AbortError") on timeout — callers should catch and
 * fall back to cached data when appropriate.
 */
export const fetchWithTimeout = (url, init = {}, timeoutMs = 15000) => {
  if (!timeoutMs || typeof AbortController === 'undefined') {
    return fetch(url, init);
  }
  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), timeoutMs);
  const merged = { ...init, signal: init.signal || controller.signal };
  return fetch(url, merged).finally(() => clearTimeout(handle));
};

/** Convenience: apiFetch + parse JSON. Throws on non-2xx with message from body. */
export const apiJson = async (url, options = {}) => {
  const response = await apiFetch(url, options);
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { /* leave as null */ }
  }

  if (!response.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed: ${response.status}`
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};
