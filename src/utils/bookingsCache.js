const BOOKINGS_CACHE_KEY = 'bookingsMeCacheV1';
const BOOKINGS_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const ACTIVE_MEMBERSHIP_CACHE_KEY = 'activeMembershipMeCacheV1';
const ACTIVE_MEMBERSHIP_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

export const readBookingsCache = () => {
  try {
    const raw = sessionStorage.getItem(BOOKINGS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = Array.isArray(parsed?.data) ? parsed.data : null;

    if (!data || !timestamp) {
      sessionStorage.removeItem(BOOKINGS_CACHE_KEY);
      return null;
    }

    const isExpired = Date.now() - timestamp > BOOKINGS_CACHE_MAX_AGE_MS;
    if (isExpired) {
      sessionStorage.removeItem(BOOKINGS_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(BOOKINGS_CACHE_KEY);
    return null;
  }
};

export const writeBookingsCache = (bookings) => {
  if (!Array.isArray(bookings)) return;

  const payload = {
    timestamp: Date.now(),
    data: bookings
  };

  sessionStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify(payload));
};

export const clearBookingsCache = () => {
  sessionStorage.removeItem(BOOKINGS_CACHE_KEY);
};

export const readActiveMembershipCache = () => {
  try {
    const raw = sessionStorage.getItem(ACTIVE_MEMBERSHIP_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : null;

    if (!data || !timestamp) {
      sessionStorage.removeItem(ACTIVE_MEMBERSHIP_CACHE_KEY);
      return null;
    }

    const isExpired = Date.now() - timestamp > ACTIVE_MEMBERSHIP_CACHE_MAX_AGE_MS;
    if (isExpired) {
      sessionStorage.removeItem(ACTIVE_MEMBERSHIP_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(ACTIVE_MEMBERSHIP_CACHE_KEY);
    return null;
  }
};

export const writeActiveMembershipCache = (membership) => {
  if (!membership || typeof membership !== 'object') return;

  const payload = {
    timestamp: Date.now(),
    data: membership
  };

  sessionStorage.setItem(ACTIVE_MEMBERSHIP_CACHE_KEY, JSON.stringify(payload));
};

export const clearActiveMembershipCache = () => {
  sessionStorage.removeItem(ACTIVE_MEMBERSHIP_CACHE_KEY);
};
