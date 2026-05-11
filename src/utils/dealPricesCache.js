/**
 * Deal-prices cache (stale-while-revalidate, localStorage-backed).
 *
 * The backend /deal-prices endpoint can be slow / 504. We keep a long-lived
 * snapshot in localStorage so the UI can render instantly off cache and
 * refresh in the background.
 */

const DEAL_PRICES_CACHE_KEY = 'dealPricesCacheV2';
const LEGACY_KEY = 'dealPricesCacheV1';
const DEAL_PRICES_FRESH_MS = 30 * 60 * 1000;          // fresh for 30 min
const DEAL_PRICES_HARD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // drop after 7 days

const readRaw = () => {
  try {
    const raw = localStorage.getItem(DEAL_PRICES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = Array.isArray(parsed?.data) ? parsed.data : null;
    if (!data || !timestamp) {
      localStorage.removeItem(DEAL_PRICES_CACHE_KEY);
      return null;
    }
    const age = Date.now() - timestamp;
    if (age > DEAL_PRICES_HARD_TTL_MS) {
      localStorage.removeItem(DEAL_PRICES_CACHE_KEY);
      return null;
    }
    return { data, timestamp, age };
  } catch {
    try { localStorage.removeItem(DEAL_PRICES_CACHE_KEY); } catch { /* ignore */ }
    return null;
  }
};

/** Returns { data, isStale } or null. `isStale` => caller should refresh in background. */
export const readDealPricesCacheEntry = () => {
  const entry = readRaw();
  if (!entry) return null;
  return { data: entry.data, isStale: entry.age > DEAL_PRICES_FRESH_MS };
};

/** Backward-compatible: fresh data only, else null. */
export const readDealPricesCache = () => {
  const entry = readRaw();
  if (!entry) return null;
  return entry.age > DEAL_PRICES_FRESH_MS ? null : entry.data;
};

/** Last-resort fallback when the network call fails — returns any cached data. */
export const readStaleDealPricesCache = () => {
  const entry = readRaw();
  return entry ? entry.data : null;
};

export const writeDealPricesCache = (dealPrices) => {
  if (!Array.isArray(dealPrices)) return;
  const payload = { timestamp: Date.now(), data: dealPrices };
  try {
    localStorage.setItem(DEAL_PRICES_CACHE_KEY, JSON.stringify(payload));
  } catch { /* quota exhausted / unavailable */ }
};

export const clearDealPricesCache = () => {
  try { localStorage.removeItem(DEAL_PRICES_CACHE_KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
};
