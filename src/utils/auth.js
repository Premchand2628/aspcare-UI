const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

const TOKEN_KEYS = ['authToken', 'token', 'jwt'];

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // Allow 30 second buffer
    return payload.exp * 1000 < Date.now() - 30000;
  } catch {
    return true;
  }
};

const readTokenCandidates = () => {
  const localCandidates = TOKEN_KEYS.map((key) => localStorage.getItem(key));
  const sessionCandidates = TOKEN_KEYS.map((key) => sessionStorage.getItem(key));
  return [...localCandidates, ...sessionCandidates]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
};

export const clearAuthSession = () => {
  TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const getValidatedAuthToken = () => {
  const token = readTokenCandidates().find((candidate) => JWT_PATTERN.test(candidate)) || '';

  if (!token || isTokenExpired(token)) {
    clearAuthSession();
    return '';
  }

  localStorage.setItem('authToken', token);
  return token;
};

export const hasValidAuthSession = () => Boolean(getValidatedAuthToken());

export const withAuthHeader = (headers = {}) => {
  const token = getValidatedAuthToken();
  if (!token) {
    return { ...headers };
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`
  };
};
