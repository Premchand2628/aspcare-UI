const SERVICES_CACHE_KEY = 'servicesCacheV1';
const SERVICES_CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export const readServicesCache = () => {
  try {
    const raw = sessionStorage.getItem(SERVICES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = Array.isArray(parsed?.data) ? parsed.data : null;

    if (!data || !timestamp) {
      sessionStorage.removeItem(SERVICES_CACHE_KEY);
      return null;
    }

    const isExpired = Date.now() - timestamp > SERVICES_CACHE_MAX_AGE_MS;
    if (isExpired) {
      sessionStorage.removeItem(SERVICES_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(SERVICES_CACHE_KEY);
    return null;
  }
};

export const writeServicesCache = (services) => {
  if (!Array.isArray(services)) return;
  const payload = { timestamp: Date.now(), data: services };
  try {
    sessionStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage full / unavailable — ignore
  }
};

export const clearServicesCache = () => {
  sessionStorage.removeItem(SERVICES_CACHE_KEY);
};
