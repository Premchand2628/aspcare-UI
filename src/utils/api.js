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

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: finalBody,
    signal
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
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
