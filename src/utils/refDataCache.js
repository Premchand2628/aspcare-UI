/**
 * Generic sessionStorage cache for reference / semi-static data.
 * Default TTL: 10 minutes (vehicle types, wash levels, areas rarely change).
 */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export const readCache = (key, ttlMs = DEFAULT_TTL_MS) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (!data || !timestamp || Date.now() - timestamp > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

export const writeCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* quota exceeded – ignore */ }
};

export const clearCache = (key) => sessionStorage.removeItem(key);

// Well-known keys
export const CACHE_KEYS = {
  VEHICLE_TYPES: 'vehicleTypesCacheV1',
  WASH_LEVELS: 'washLevelsCacheV1',
  AREAS: 'areasCacheV1',
  CENTRES: 'centresCacheV1',   // per-area: append ':' + area
  PROFILE: 'profileCacheV1',
};
