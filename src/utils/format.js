/**
 * Centralised formatting helpers.
 * Replaces per-page formatDate / formatPhone / "₹" string concatenation.
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

/** 399 → "₹399" ; 1299.5 → "₹1,300" */
export const formatINR = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  return INR_FORMATTER.format(n);
};

/** "2026-04-18" | Date → "18-APR-2026" */
export const formatDateShort = (value) => {
  if (!value) return 'N/A';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  return `${day}-${month}-${d.getFullYear()}`;
};

/** "2026-04-18" | Date → "Apr 18, 2026" (for order listings) */
export const formatDateLong = (value) => {
  if (!value) return 'N/A';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Date → "2026-04-18" (API-safe, no timezone surprises) */
export const formatDateApi = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** "09:00-10:00" + date → "18-APR-2026, 9:00AM" */
export const formatSlotDateTime = (dateValue, timeSlot) => {
  const datePart = formatDateShort(dateValue);
  if (datePart === 'N/A' || !timeSlot) return datePart;
  const [start] = String(timeSlot).split('-');
  const [hStr, mStr = '00'] = String(start || '').split(':');
  const h = parseInt(hStr, 10);
  if (!Number.isFinite(h)) return datePart;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 || 12;
  return `${datePart}, ${display}:${mStr}${ampm}`;
};

/**
 * Mask all but last 4 digits of a phone number for display / logging.
 *   "9876543210"  → "******3210"
 *   "+919876543210" → "+91******3210"
 */
export const maskPhone = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return '';
  const match = s.match(/^(\+?\d{0,3})?(\d+)$/);
  if (!match) return s.replace(/\d(?=\d{4})/g, '*');
  const cc = match[1] || '';
  const rest = match[2] || '';
  if (rest.length <= 4) return cc + rest;
  return cc + '*'.repeat(rest.length - 4) + rest.slice(-4);
};

/**
 * Normalise user-typed phone input to 10-digit Indian mobile.
 * Returns '' if invalid.
 */
export const normaliseIndianPhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return '';
};

export const isValidIndianPhone = (raw) => /^[6-9]\d{9}$/.test(normaliseIndianPhone(raw));
