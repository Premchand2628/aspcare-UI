const normalizeText = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');

export const getStoredPhone = () => {
  const possibleKeys = ['phone', 'userPhone', 'mobileNumber', 'mobile', 'contact'];
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

export const toApiServiceType = (value) => {
  const normalized = normalizeText(value);
  if (normalized === 'SELFDRIVE' || normalized === 'SELF_DRIVE') return 'SELF_DRIVE';
  return 'HOME';
};

export const toUiServiceType = (value) => {
  const normalized = toApiServiceType(value);
  return normalized === 'SELF_DRIVE' ? 'Self Drive' : 'Home';
};

export const toApiWaterProvidedBoolean = (value) => {
  const raw = String(value ?? '').trim().toUpperCase();
  return raw === 'Y' || raw === 'TRUE' || raw === 'GIVE-WATER' || raw === 'GIVE_WATER';
};

export const toApiWaterProvidedFlag = (value) => (toApiWaterProvidedBoolean(value) ? 'Y' : 'N');

export const toApiTimeSlot = (value) => {
  const slot = String(value || '').trim();
  if (!slot) return '';
  return slot;
};
