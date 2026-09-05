# Smart Dairy Hub — Security Audit (2026-09-05)

Read-only audit. No code, data, policy, or configuration was changed.
Scope: app source (`src/`), backend functions (`supabase/functions/`), database
schema/RLS/triggers/grants, storage buckets & policies, auth flows, build and
domain configuration, dependencies.

## A. Overall rating

**Good / production-viable, with one real privilege-escalation gap and a few
hardening gaps.** The project already has strong foundations: RLS enabled on all
30 public tables, PII moved behind `SECURITY DEFINER` RPCs, server-authoritative
checkout, guard triggers on the moderation-sensitive tables, and no secrets in
client code.

Rating: **B+ (82/100)** (would be A- after items B1, C1, C2 below).

## B. Critical issues

**B1 — Vets can self-verify their own professional profile** — CRITICAL
- Vulnerability: `vet_profiles` UPDATE policy (`Vet owners update own profile`,
  `user_id = auth.uid()`) is column-unrestricted, and the table's only trigger is
  `trg_vet_profiles_updated_at`. Unlike `products`, `orders` and
  `dairy_companies` — which each have a guard trigger — nothing prevents a vet
  from setting `verification_status = 'verified'` (and `available = true`)
  directly through the data API.
- Why it matters: `validate_appointment_insert()` only allows bookings against
  verified+available vets, so this is the exact control that gates who farmers
  are told to trust with animal health. A self-verified account also gains the
  "Verified" badge in the UI.
- Affected: DB policy on `public.vet_profiles`; consumed by
  `src/pages/VetDashboard.tsx`, `src/pages/BookVet.tsx`, `src/pages/VetContacts.tsx`.
- Attack scenario: sign up → pick the vet role → one PATCH to
  `/rest/v1/vet_profiles?user_id=eq.<self>` with `{"verification_status":"verified"}`
  → appear as a verified vet and receive real consultation requests with farmer
  phone numbers.
- Verified: yes (policy + trigger inventory read directly from the database).
- Fix: add a `BEFORE UPDATE` guard trigger (`guard_vet_profile_moderation`)
  mirroring `guard_product_moderation`: non-admins keep the old
  `verification_status` / `rejection_reason` / `reviewed_by` / `reviewed_at`, and
  editing licence or identity fields resets status to `pending`.
- Safe to automate: yes — additive trigger, no data loss, no UI change. Needs
  approval because it changes who is treated as verified.

No other critical issue found.

## C. High-risk issues

**C1 — Public `images` bucket accepts any file type and any size** — HIGH
- `storage.buckets`: `images` is `public = true`, `file_size_limit = NULL`,
  `allowed_mime_types = NULL`. Upload is restricted to
  `authenticated` writing under their own `auth.uid()/` prefix (good), but any
  signed-in user can store an `.svg` / `.html` payload and get a permanent
  public URL on the storage origin, or upload multi-GB files.
- Risk: stored-XSS-style payload hosted on a project URL, plus storage cost
  abuse. Not same-origin with the app, so app session theft is not direct.
- Fix: set `allowed_mime_types = {image/jpeg,image/png,image/webp}` and
  `file_size_limit = 5 MB` on `images` (and 20 MB / image+video on
  `cattle-media`), and keep client-side type checks as UX only.
- Verified: yes. Safe to automate: yes (may reject unusual existing upload paths,
  hence approval).

**C2 — No rate limiting on public, cost-bearing edge functions** — HIGH
- `analyze-animal-health` (AI vision), `translate` (AI + service-role writes to
  `translation_cache`), `geo-resolve` and `nearby-vets` (paid Google Maps) run
  with `verify_jwt = false` or no user check, unauthenticated, with wildcard CORS.
- Risk: credit/billing drain and Maps quota exhaustion by anyone with the URL.
- Fix: per-IP + per-user counters in a small `api_usage` table checked at the top
  of each function, plus request-body size caps (`analyze-animal-health` currently
  accepts an unbounded base64 image). Lovable has no built-in limiter, so this is
  app-level code.
- Verified: yes (config + code). Safe to automate: yes, but it is new logic on
  live endpoints — approval recommended.

## D. Medium-risk issues

- **D1 — Wildcard CORS (`*`) on all 9 functions.** Acceptable for the genuinely
  public ones (`translate`, `geo-resolve`, `nearby-vets`); should be narrowed to
  the three production origins for `place-order`, `chat-assistant`, `kb-ingest`,
  `mcp`. Low exploitability because they authenticate via bearer token, not
  cookies (no CSRF surface), but it removes a cheap barrier to scraping/abuse.
- **D2 — No security headers.** `index.html` sets no CSP, `Referrer-Policy`,
  `X-Content-Type-Options`, `Permissions-Policy` or frame protection, and the
  static host does not add them. A meta-tag CSP is feasible but must allow
  Google Maps, Fonts, the AI gateway, Supabase and the Lovable badge; a wrong CSP
  breaks Maps and OAuth, so this needs staged testing.
- **D3 — `orders` buyer UPDATE policy is column-unrestricted.** The scanner flags
  total/status tampering; in practice `guard_order_updates()` raises on any change
  to `buyer_id`, `total` or `status`, so it is **mitigated, not vulnerable**. The
  residual gap: a buyer can still rewrite `shipping_address` on a pending order,
  which is intended. Recommend tightening the policy anyway for defence in depth.
- **D4 — Two `SECURITY DEFINER` functions executable by `anon`**:
  `get_top_help_searches`, `get_top_help_faqs`. They return only aggregated,
  non-personal help-centre counts, so impact is informational; revoking `anon`
  EXECUTE would remove the linter warning at the cost of anonymous help ranking.
- **D5 — `pgvector` extension installed in `public`.** Standard Supabase linter
  warning; no known exploitation path here.

## E. Low / informational

- `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML`, but only for
  generated CSS variables from a static config — not user input. **PASS.**
- All redirect sinks are guarded: `Login.tsx` filters `next` through
  `isSafeRelativePath`, `AuthContext` requires `/` and rejects `//`,
  `src/lib/safe-url.ts` blocks `javascript:`/`data:` hrefs. No open redirect found.
- `localStorage`/`sessionStorage` holds only language, theme, role choice, TTS
  prefs, wishlist, chat history and the Supabase session (library default). No
  custom credential storage. **PASS.**
- Client env vars are limited to the Supabase URL/publishable key, project id and
  the Google Maps *browser* key — all publishable by design. **Confirm the Maps
  browser key is restricted to `smartdairyhub.online`, `www.smartdairyhub.online`
  and the Lovable preview host in Google Cloud Console** (external, not verifiable
  from code).
- `robots.txt` disallows `/admin`, `/vet-dashboard`, `/industry`, `/mediator`,
  `/seller`, `/orders`, `/notifications`, `/my-listings`, `/my-appointments`,
  `/cart`, and those routes are also server-enforced by RLS — not obscurity-only.
- Logging: functions log statuses and error text, never keys or tokens. Spot-check
  found no password/token logging.

## F. Authentication assessment — PASS with notes

Email/password + Google OAuth via the managed backend client; PKCE and OAuth
state are handled by the auth library, sessions auto-refresh, `signOut()` clears
local state and stored redirect keys. `ResetPassword.tsx` correctly waits for the
`PASSWORD_RECOVERY` event, validates password strength, and forces re-login.
Note: Google consent still shows Lovable-managed branding until a dedicated
Google OAuth client is configured — a branding/trust issue, not a vulnerability.
Not verifiable from code: OTP expiry, leaked-password protection, session TTL and
the exact authorized redirect URI list (provider-side settings).

## G. Authorization assessment — one gap (B1)

`ProtectedRoute` + `requiredRole` is UI-only, correctly backed server-side by RLS
and `has_role()` on every table. Roles live in a separate `user_roles` table with
`guard_user_roles_changes()` blocking self-granted roles — no privilege
escalation there. `place-order` and `kb-ingest` verify the caller with
`auth.getUser()` before using service-role. IDOR checks on `orders`,
`order_items`, `notifications`, `milk_records`, `appointments`, `cattle_listings`
all scope to `auth.uid()`.

## H. Database / RLS assessment — PASS

RLS enabled on all 30 public tables, every table has at least one policy, PII
(phones, emails) is reachable only through owner/participant-scoped RPCs, all
custom functions pin `search_path`. No dynamic SQL string concatenation found →
no SQL injection surface. Only remaining gap is the missing `vet_profiles` guard.

## I. API assessment — WARN

Auth and input validation are solid (`place-order` re-prices server-side and
decrements stock atomically; `translate` caps 120 texts × 600 chars;
`nearby-vets` clamps radius and validates coordinates; `kb-ingest` restricts
fetches to an allowlisted base URL, closing the earlier SSRF). Missing: rate
limits, request-size caps, and narrowed CORS.

## J. Secrets assessment — PASS

No API key, OAuth secret, service-role key, DB password or JWT secret found in
tracked source. Service-role keys are read only via `Deno.env.get` inside edge
functions. `.env` contains publishable values only. No rotation required based on
this audit.

## K. Dependency assessment — PASS

`npm audit` reports no high or critical vulnerabilities. No major upgrades
recommended right now.

## L. Security headers assessment — FAIL (nothing set)

See D2. Recommended, in order of safety: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
(allow geolocation/microphone/camera — all three are used), frame-ancestors, then
a tested CSP last.

## M. Production-readiness assessment

HTTPS is enforced on both `smartdairyhub.online` and the published Lovable host;
auth cookies/tokens are managed by the auth library. Ready for production once
B1 is fixed; C1/C2/D1/D2 are hardening that should follow.

## N. Recommended security architecture

Client (no secrets, UI-only role checks) → RLS-enforced data API with all PII
behind participant-scoped `SECURITY DEFINER` RPCs → edge functions for anything
privileged, each verifying the caller and rate-limiting → moderation/verification
state writable only by admins, enforced by guard triggers → storage buckets with
MIME and size allowlists → response headers hardened at the host.

## O. Prioritized remediation plan

1. `vet_profiles` guard trigger (B1) — needs approval.
2. Storage MIME/size limits on `images` and `cattle-media` (C1) — needs approval.
3. Rate limiting + body-size caps on the four public functions (C2).
4. Narrow CORS on authenticated functions (D1).
5. Column-restrict the `orders` buyer UPDATE policy (D3).
6. Security headers, CSP last and tested against Maps/OAuth (D2).
7. Optional: revoke `anon` EXECUTE on the two help-centre aggregate functions (D4).

## Security checklist

| Area | Status |
| --- | --- |
| Authentication (OAuth, email, session, logout, reset) | PASS |
| Provider-side auth settings (OTP expiry, leaked-password, session TTL) | UNVERIFIED (provider console) |
| Authorization / RBAC (server-side) | WARN — vet self-verification |
| IDOR / BOLA | PASS |
| RLS enabled + policies present on all tables | PASS |
| Privilege escalation via roles table | PASS |
| Moderation guard triggers (products, orders, companies) | PASS |
| Moderation guard trigger (vet_profiles) | FAIL |
| SQL injection / dynamic SQL | PASS |
| Edge-function authentication | PASS |
| Input validation | PASS |
| Rate limiting / abuse protection | FAIL |
| Request-size limits | WARN |
| CORS configuration | WARN |
| XSS (stored / reflected / DOM) | PASS |
| Open redirect | PASS |
| Client-side secret exposure | PASS |
| Client storage of sensitive data | PASS |
| File-upload type/size restrictions | FAIL |
| Storage object access control | WARN — public images bucket |
| SSRF | PASS (kb-ingest allowlisted) |
| Path traversal / command / template injection | N/A — no such sinks |
| CSRF | N/A — bearer-token APIs, no cookie auth |
| Security headers / CSP | FAIL |
| HTTPS / domain configuration | PASS |
| Secrets management | PASS |
| Dependencies | PASS |
| Error handling / information disclosure | PASS |
| Logging (no credential leakage) | PASS |
| Auth-event / admin-action audit logging | WARN — partial |
| Admin function protection | PASS |
| Privacy / data minimisation | PASS |
| SEO / private-page indexing | PASS |

## Verification boundaries

- **Verified from code and live database:** all RLS policies, grants, triggers,
  functions, storage buckets and policies, edge-function code and JWT settings,
  client-side sinks, env exposure, dependency audit.
- **Not verifiable here:** provider auth settings (OTP expiry, leaked-password
  protection, session lifetime, authorized redirect URIs), Google Cloud API-key
  restrictions, CDN/WAF and host response headers, real-world traffic monitoring.
- **Requires external access:** Google Cloud Console (Maps key + own OAuth
  client), DNS/host header configuration.

This audit is a code, configuration and database review with non-destructive
checks. It is not a full penetration test, and the application should not be
described as "fully tested" or "100% secure".
