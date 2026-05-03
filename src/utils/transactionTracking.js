const TRANSACTION_ID_KEY = 'aspTransactionId';
const FETCH_PATCH_FLAG = '__aspFetchTransactionPatched';
const TRANSACTION_HEADER = 'X-Transaction-Id';

const shouldLogRequests = () => {
  if (typeof import.meta !== 'undefined' && import.meta?.env) {
    const explicit = String(import.meta.env.VITE_ENABLE_REQUEST_LOGGING || '').toLowerCase();
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    return Boolean(import.meta.env.DEV);
  }
  return false;
};

const generateTransactionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `tx-${Date.now()}-${randomPart}`;
};

export const getOrCreateTransactionId = () => {
  const existing = sessionStorage.getItem(TRANSACTION_ID_KEY);
  if (existing) return existing;

  const created = generateTransactionId();
  sessionStorage.setItem(TRANSACTION_ID_KEY, created);
  return created;
};

export const resetTransactionId = () => {
  sessionStorage.removeItem(TRANSACTION_ID_KEY);
};

export const startNewTransactionId = () => {
  resetTransactionId();
  return getOrCreateTransactionId();
};

const getRequestUrl = (input) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input === 'object' && 'url' in input) return input.url;
  return 'unknown-url';
};

const getRequestMethod = (input, init) => {
  const fromInit = init?.method;
  if (fromInit) return String(fromInit).toUpperCase();

  if (input && typeof input === 'object' && 'method' in input && input.method) {
    return String(input.method).toUpperCase();
  }

  return 'GET';
};

const withTransactionHeader = (input, init, transactionId) => {
  const mergedHeaders = new Headers(init?.headers || undefined);

  if (input && typeof input === 'object' && 'headers' in input && input.headers) {
    const requestHeaders = new Headers(input.headers);
    requestHeaders.forEach((value, key) => {
      if (!mergedHeaders.has(key)) {
        mergedHeaders.set(key, value);
      }
    });
  }

  mergedHeaders.set(TRANSACTION_HEADER, transactionId);

  return {
    ...(init || {}),
    headers: mergedHeaders
  };
};

export const installFetchTransactionInterceptor = () => {
  if (typeof window === 'undefined') return;
  if (window[FETCH_PATCH_FLAG]) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const transactionId = getOrCreateTransactionId();
    const method = getRequestMethod(input, init);
    const url = getRequestUrl(input);
    const start = performance.now();

    try {
      const nextInit = withTransactionHeader(input, init, transactionId);
      const response = await nativeFetch(input, nextInit);

      if (shouldLogRequests()) {
        const elapsedMs = Math.round(performance.now() - start);
        console.info(`[api][tx:${transactionId}] ${method} ${url} -> ${response.status} (${elapsedMs}ms)`);
      }

      return response;
    } catch (error) {
      if (shouldLogRequests()) {
        const elapsedMs = Math.round(performance.now() - start);
        // Intentionally do NOT log the raw error (may contain request bodies, tokens, PII)
        const safeName = (error && error.name) ? error.name : 'Error';
        console.error(`[api][tx:${transactionId}] ${method} ${url} -> FAILED (${elapsedMs}ms) [${safeName}]`);
      }
      throw error;
    }
  };

  window[FETCH_PATCH_FLAG] = true;
};
