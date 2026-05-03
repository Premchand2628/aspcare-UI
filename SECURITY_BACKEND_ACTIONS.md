# Security Audit — Action Items Requiring Backend / Operator Work

Items from the audit that **cannot** be fixed in this frontend repo.
Grouped by where the change lives.

---

## 1. Deploy the config changes already made in this repo

| File | Where it goes on the server |
|---|---|
| `logging-config/logback-prod.xml` | `/etc/carwash/logback-prod.xml` (already referenced by each service's `-Dlogging.config=...` JVM arg) |
| `logging-config/logback-qa.xml` | `/etc/carwash/logback-qa.xml` |
| `logging-config/nginx-http-hardening.conf` | **New:** `/etc/nginx/conf.d/00-hardening.conf` |
| `nginx-aspcarcare.conf` | `/etc/nginx/sites-available/aspcarcare.com` (same as today) |
| `nginx-qa.conf` | `/etc/nginx/sites-available/qa.aspcarcare.com` |
| `nginx-stg.conf` | `/etc/nginx/sites-available/stg.aspcarcare.com` |

Then:
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart 'carwash-*.service'   # picks up new logback config
```

Verify after reload:
- `curl -I https://aspcarcare.com` → should show `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`, and **no** `Server: nginx/1.x.y` version.
- `for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://aspcarcare.com/auth/send-otp-generic -H 'Content-Type: application/json' -d '{"mobileNumber":"9999999999"}'; done` → should show `429` after 5 requests.
- `tail /var/log/carwash/prod/*.log | grep -iE '(otp|password|bearer)'` → values should show `***`.

---

## 2. C1 / C2 — Move JWT out of `localStorage` (backend + frontend work)

Current state: the browser stores `authToken`, `refreshToken`, `userPhone`, `userEmail`, `userFirstName` in `localStorage`, which is readable by any XSS payload.

Backend work required first:
1. On `/auth/login/verify-otp`, `/auth/login`, `/auth/signup` success — set the JWT as:
   ```
   Set-Cookie: asp_at=<access_token>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
   Set-Cookie: asp_rt=<refresh_token>; Path=/auth/refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
   ```
2. Add `/auth/refresh` that rotates using the cookie and returns a new access cookie.
3. Add CSRF protection for state-changing endpoints (double-submit token or `Origin` header check — cheapest is the latter since we're single-origin).
4. Stop returning the JWT in the JSON response body.

Then in the frontend:
1. Delete the `localStorage.setItem('authToken', ...)` / `refreshToken` calls from Login.jsx.
2. Delete `TOKEN_KEYS` and `readTokenCandidates` from `auth.js` — the browser attaches the cookie automatically.
3. Change `hasValidAuthSession()` to a server round trip (`GET /users/me`) cached in memory for the app lifetime, not a client-side JWT decode.
4. Remove `userPhone` / `userEmail` from localStorage; fetch from `/users/me` when needed.

---

## 3. B1 / B2 / B3 — Move pricing + rewards to the backend

Current state: the client sends a final `subTotal` to the backend at booking-create time. Anyone can tamper with it.

Endpoints to create (suggested):

| Endpoint | Purpose |
|---|---|
| `POST /bookings/quote` | Input: `{centerId, serviceType, washType, carType, date, slot, promoCode?, membershipId?, useSubscription?}`. Output: `{basePrice, membershipDiscount, promoDiscount, signupBonus, taxes, total, currency, quoteToken}`. |
| `POST /bookings` | Client sends `{quoteToken, paymentMethod, ...}`. Server re-reads the quote, verifies it hasn't expired (5 min TTL), uses the server-side `total`. |
| `GET /rewards/me` | Returns `{balance, recentEarnings[]}`. Backend owns the drops-per-wash mapping that currently lives in `RewardsCalculation.jsx`. |

After these exist:
- `Review.jsx` stops computing `promoDiscount`, `membershipDiscount`, `signupBonus`, `totalAmount`. It renders whatever the quote returned.
- `RewardsCalculation.jsx` becomes a dumb renderer of `/rewards/me`. The `dropsMap` constant is deleted.
- The `isSignupBonus` branch in Review.jsx (lines 123–138) is deleted — server decides.

---

## 4. B4 — Lock down `/auth/check-phone`

Current state: returns `{exists: true, email: "..."}`, leaking account enumeration.

Fix options (pick one):
- **Preferred:** delete the endpoint. Flow becomes: user enters phone → always send OTP. If number has no account, the flow creates one during verify-OTP; the UI stops branching on `exists`.
- **If kept:** return `{ok: true}` unconditionally, send the OTP in both cases, never return `email`. Add `auth_zone` rate limit (already covered by the new nginx config).

---

## 5. Backend logging hygiene (defence-in-depth)

Even though `logback-prod.xml` now masks on output, the upstream `HttpRequestResponseLoggingFilter` should also be narrowed so we don't depend solely on the regex:

1. Add a deny-list of paths whose bodies are never logged:
   `/auth/login/send-otp`, `/auth/login/verify-otp`, `/auth/send-otp*`, `/auth/verify-otp*`, `/auth/forgot-password*`, `/auth/reset-password*`, `/users/me/password`, `/payments/*`.
   For these routes, log only `method + path + status + durationMs`.

2. In application code, change `log.info("user={}", phone)` style calls to use a helper:
   ```java
   log.info("user={}", PhoneMask.last4(phone));   // e.g. "******3210"
   ```

3. Cap HTTP body logging at 2 KiB to prevent accidental dump of images / PDFs.

---

## 6. Frontend items flagged as backend-dependent

| Audit ID | Blocked on |
|---|---|
| C1, C2 | §2 above (httpOnly cookie rollout) |
| B1, B2, B3 | §3 above (`/bookings/quote` + `/rewards/me`) |
| B4 | §4 above |
| B5 | Needs a `/bookings/validate` endpoint before any booking prefill is trustworthy |
| B6 | Already acceptable — auth.js only *hints* at expiry; backend enforces. No change needed beyond §2. |
| B7 | Already acceptable — current `ProtectedRoute` is UX only; backend returns 401 on unauth API calls, and `apiFetch` now clears session on 401. |

---

## 7. Other hardening already shipped in this repo

- Grafana dashboard: OTP/phone panel in `grafana-dashboard-prod.json` replaced with a "removed" notice.
- `vite.config.js`: `build.sourcemap: false`, `esbuild.pure: ['console.log','console.debug','console.info']`, manual vendor chunks, Razorpay/Google/Facebook hosts in CSP.
- `src/utils/transactionTracking.js`: error logger no longer prints the raw `error` object (avoids accidental payload leak).
- `src/pages/Login.jsx` line 8: QA OTP rate-limit bypass flag removed; all rate limits are server-side.
- Route-level code splitting via `React.lazy` in `App.jsx` plus a `Suspense` fallback.
- `ErrorBoundary` wraps the router → no more white-screen on render crashes.
- Helpers centralised: `src/utils/api.js` (`apiFetch`, `apiJson`), `src/utils/format.js` (`formatINR`, `formatDate*`, `maskPhone`, `normaliseIndianPhone`).

Page files (Login.jsx, Review.jsx, Booking.jsx, etc.) have **not** been rewritten to use the new helpers — do that incrementally. Each page can switch from raw `fetch` + `withAuthHeader` to a one-line `apiFetch(url, { method: 'POST', json: body })`.

---

## 8. Items not yet addressed in this pass

- **Seed data (H3):** `seed_data.sql` includes real business addresses + GPS. Decision needed: keep (if locations are public) or scrub.
- **Cache TTL (#9):** checked — all 4 caches (`bookingsCache.js`, `dealPricesCache.js`, `subscriptionsCache.js`, `refDataCache.js`) already have expiry. No action.
- **Component bloat:** Booking.jsx (1300+), Login.jsx (1100+), Review.jsx (~800) still monolithic. Defer to a dedicated refactor pass; none of the current fixes are blocked by this.
- **Sentry:** the ErrorBoundary's `componentDidCatch` is the natural hook-in point when Sentry is added later.
- **PNG → WebP:** `public/images/` still PNG. A build-time plugin (`vite-imagetools` or manual `cwebp`) would trim ~50%. Deferred — no functional impact.
