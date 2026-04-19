const DEAL_PRICES_CACHE_KEY = 'dealPricesCacheV1';
const DEAL_PRICES_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

export const readDealPricesCache = () => {
  try {
    const raw = sessionStorage.getItem(DEAL_PRICES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = Array.isArray(parsed?.data) ? parsed.data : null;

    if (!data || !timestamp) {
      sessionStorage.removeItem(DEAL_PRICES_CACHE_KEY);
      return null;
    }

    const isExpired = Date.now() - timestamp > DEAL_PRICES_CACHE_MAX_AGE_MS;
    if (isExpired) {
      sessionStorage.removeItem(DEAL_PRICES_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(DEAL_PRICES_CACHE_KEY);
    return null;
  }
};

export const writeDealPricesCache = (dealPrices) => {
  if (!Array.isArray(dealPrices)) return;

  const payload = {
    timestamp: Date.now(),
    data: dealPrices
  };

  sessionStorage.setItem(DEAL_PRICES_CACHE_KEY, JSON.stringify(payload));
};

export const clearDealPricesCache = () => {
  sessionStorage.removeItem(DEAL_PRICES_CACHE_KEY);
};
