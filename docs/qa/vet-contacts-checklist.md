# Vet Contacts — E2E Test Checklist

Manual QA checklist for the Veterinary Contacts page (`/vet-contacts`). Pair with the
automated smoke tests in `src/components/vet/VetCard.test.tsx` and
`tests/smoke/vet-contacts.smoke.py` (Playwright).

## 1. Location detection
- [ ] First visit: browser prompts for location permission.
- [ ] On **Allow**: a "Using your location" indicator appears, radius selector becomes active, results load.
- [ ] On **Deny**: friendly fallback message shown ("Enable location…"). Directory tab still usable.
- [ ] On **Unsupported / insecure context**: same fallback as deny, no console crash.
- [ ] Slow GPS (>10s) shows a loading state, not a hung spinner.
- [ ] Re-clicking "Use my location" re-triggers `geolocation.getCurrentPosition`.

## 2. Nearby fetch (`nearby-vets` edge function)
- [ ] Authenticated user: returns up to N clinics within selected radius.
- [ ] Unauthenticated user: receives 401 and UI prompts sign-in (no raw error).
- [ ] Radius selector (5, 10, 20, 30, 50 km) re-fetches and updates count.
- [ ] Empty radius (e.g. 5km in remote area) auto-expands and surfaces a notice.
- [ ] Each result shows: name, distance, rating (if any), open-now badge, govt badge (if any).
- [ ] Cards sort by distance ascending.
- [ ] Network failure → toast + retry button, no white screen.

## 3. Call action
- [ ] Phone present: button enabled, anchor has `href="tel:+91XXXXXXXXXX"`.
- [ ] Phone missing: button disabled, no anchor rendered.
- [ ] Mobile device: tapping opens the dialer with number prefilled.
- [ ] Desktop: opens system handler (or shows OS prompt) — no app crash.

## 4. WhatsApp action
- [ ] Phone present and ≥10 digits: button enabled.
- [ ] Anchor `href` matches `https://wa.me/91XXXXXXXXXX` (no `+`).
- [ ] Opens in new tab (`target="_blank"`, `rel` contains `noopener`).
- [ ] Invalid / short phone: button disabled.

## 5. Directions action
- [ ] When `maps_url` is set: link uses it verbatim.
- [ ] Else when `lat`/`lng` set: link is `…/maps/dir/?api=1&destination=LAT,LNG`.
- [ ] Else: link is `…/maps/search/?api=1&query=<hospital, address, name>`.
- [ ] Always opens in a new tab; never disabled.

## 6. Filters & tabs
- [ ] Open Now filter hides closed clinics.
- [ ] Rating filter (≥4.0, ≥4.5) restricts results.
- [ ] Govt/Private filter works in both Nearby and Directory tabs.
- [ ] Map tab renders Google Map with one marker per clinic; InfoWindow safe-escapes HTML.

## 7. Responsive
- [ ] 360px mobile: 1-column cards, action buttons still tappable (≥44px target).
- [ ] 768px tablet: 2-column grid.
- [ ] ≥1024px desktop: 3-column grid; map and list side-by-side where applicable.

## 8. Accessibility
- [ ] Each action button has an `aria-label` naming the vet.
- [ ] Keyboard tab order: card header → Call → WhatsApp → Directions.
- [ ] Color contrast ≥ WCAG AA on badges (Open/Closed, rating).

---

## Automated coverage

| Layer | File | What it covers |
| --- | --- | --- |
| Unit (Vitest + RTL) | `src/components/vet/VetCard.test.tsx` | `tel:` href, `wa.me` href, directions fallback chain, disabled states, badges |
| Browser smoke (Playwright) | `tests/smoke/vet-contacts.smoke.py` | Page loads, location permission grant, nearby results render, action links have correct schemes |

Run unit tests with the project test runner. Run the Playwright smoke from a shell:
`python3 tests/smoke/vet-contacts.smoke.py`.
