/**
 * Bookings & active-membership caches (stale-while-revalidate, localStorage-backed).
 *
 * /bookings/me is per-user, so we scope cache keys by userId (best-effort —
 * if we can't decode it we fall back to a generic key).
 */

const BOOKINGS_FRESH_MS = 60 * 1000;                     // fresh for 1 min
const BOOKINGS_HARD_TTL_MS = 24 * 60 * 60 * 1000;        // drop after 24 h
const ACTIVE_MEMBERSHIP_FRESH_MS = 5 * 60 * 1000;        // fresh for 5 min
const ACTIVE_MEMBERSHIP_HARD_TTL_MS = 24 * 60 * 60 * 1000;

const LEGACY_BOOKINGS_KEY = 'bookingsMeCacheV1';
const LEGACY_ACTIVE_MEMBERSHIP_KEY = 'activeMembershipMeCacheV1';

const getUserId = () => {
  try {
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userJson) return 'anon';
    const user = JSON.parse(userJson);
    return user?.id || user?.userId || user?.phone || user?.mobileNumber || 'anon';
  } catch {
    return 'anon';
  }
};

const bookingsKey = () => `bookingsMeCacheV2:${getUserId()}`;
const activeMembershipKey = () => `activeMembershipMeCacheV2:${getUserId()}`;

const readRaw = (key, hardTtlMs, validator) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = validator(parsed?.data);
    if (!data || !timestamp) {
      localStorage.removeItem(key);
      return null;
    }
    const age = Date.now() - timestamp;
    if (age > hardTtlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return { data, timestamp, age };
  } catch {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return null;
  }
};

const writeRaw = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* ignore quota */ }
};

// ---------- /bookings/me ----------

const arrayValidator = (d) => (Array.isArray(d) ? d : null);

/** Backward-compatible: returns fresh array, or null. */
export const readBookingsCache = () => {
  const entry = readRaw(bookingsKey(), BOOKINGS_HARD_TTL_MS, arrayValidator);
  if (!entry) return null;
  return entry.age > BOOKINGS_FRESH_MS ? null : entry.data;
};

/** Returns { data, isStale } or null — supports stale-while-revalidate. */
export const readBookingsCacheEntry = () => {
  const entry = readRaw(bookingsKey(), BOOKINGS_HARD_TTL_MS, arrayValidator);
  if (!entry) return null;
  return { data: entry.data, isStale: entry.age > BOOKINGS_FRESH_MS };
};

/** Last-resort fallback when /bookings/me fails / 504s. */
export const readStaleBookingsCache = () => {
  const entry = readRaw(bookingsKey(), BOOKINGS_HARD_TTL_MS, arrayValidator);
  return entry ? entry.data : null;
};

export const writeBookingsCache = (bookings) => {
  if (!Array.isArray(bookings)) return;
  writeRaw(bookingsKey(), bookings);
};

export const clearBookingsCache = () => {
  try { localStorage.removeItem(bookingsKey()); } catch { /* ignore */ }
  try { sessionStorage.removeItem(LEGACY_BOOKINGS_KEY); } catch { /* ignore */ }
};

// ---------- active membership ----------

const objectValidator = (d) => (d && typeof d === 'object' ? d : null);

export const readActiveMembershipCache = () => {
  const entry = readRaw(activeMembershipKey(), ACTIVE_MEMBERSHIP_HARD_TTL_MS, objectValidator);
  if (!entry) return null;
  return entry.age > ACTIVE_MEMBERSHIP_FRESH_MS ? null : entry.data;
};

export const readStaleActiveMembershipCache = () => {
  const entry = readRaw(activeMembershipKey(), ACTIVE_MEMBERSHIP_HARD_TTL_MS, objectValidator);
  return entry ? entry.data : null;
};

export const writeActiveMembershipCache = (membership) => {
  if (!membership || typeof membership !== 'object') return;
  writeRaw(activeMembershipKey(), membership);
};

export const clearActiveMembershipCache = () => {
  try { localStorage.removeItem(activeMembershipKey()); } catch { /* ignore */ }
  try { sessionStorage.removeItem(LEGACY_ACTIVE_MEMBERSHIP_KEY); } catch { /* ignore */ }
};
