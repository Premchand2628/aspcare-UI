const SUBS_CACHE_KEY = 'subscriptionsCacheV1';
const SUBS_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export const readSubscriptionsCache = () => {
  try {
    const raw = sessionStorage.getItem(SUBS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = Array.isArray(parsed?.data) ? parsed.data : null;

    if (!data || !timestamp) {
      sessionStorage.removeItem(SUBS_CACHE_KEY);
      return null;
    }

    if (Date.now() - timestamp > SUBS_CACHE_MAX_AGE_MS) {
      sessionStorage.removeItem(SUBS_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(SUBS_CACHE_KEY);
    return null;
  }
};

export const writeSubscriptionsCache = (subs) => {
  if (!Array.isArray(subs)) return;
  sessionStorage.setItem(SUBS_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data: subs
  }));
};

export const clearSubscriptionsCache = () => {
  sessionStorage.removeItem(SUBS_CACHE_KEY);
};
