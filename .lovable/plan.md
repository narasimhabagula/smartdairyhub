## Reality check

You asked for 16 large workstreams (audit, full redesign, all auth, marketplace expansion, vet revamp, 9 languages, SEO, performance, cross-platform QA, etc.). That is multi-week scope. To deliver real quality, I'll execute it in **focused rounds**, not 40 shallow edits at once.

You picked **Audit & bug-fix pass** as round 1, **all 9 languages with machine translation**, and **polish Schemes UI**. I'll ship those concretely now, then iterate.

Good news: I checked `src/locales.ts` — all 9 languages (EN/TE/HI/TA/KN/ML/MR/BN/PA) already have full translation objects wired through `RESOURCES`. Nothing to machine-translate; the work is verifying every page actually *uses* `t()` instead of hard-coded strings.

## Round 1 — what I'll do this turn

### A. Audit & bug-fix
1. Walk every `<Route>` in `App.tsx` and every `<Link>`/`navigate()` call — flag dead routes, fix mismatched paths.
2. Click-trace the critical buttons you listed (Login, Google, OTP, Logout, Add/Edit/Delete Listing, Mark Sold, Save Favorite, Share, Report, Call, WhatsApp, Directions, Language Selector, Voice Search, GPS, Notifications). Fix broken handlers, missing `onClick`, swallowed errors.
3. Replace user-hostile `toast.error(error.message)` with friendly messages where the raw error leaks Postgres/Supabase internals.
4. Fix any runtime errors found in `code--read_runtime_errors` and recent console logs.
5. Add a `Mark as Sold` action on `MyListings` (currently missing) and a `Report Listing` button on `CattleDetail` (writes to existing `cattle_reports` table).
6. Tighten `ProtectedRoute` redirect-back behavior so deep links survive login.

### B. Language switching
7. Confirm `LanguagePicker` saves to `profiles.language` + `localStorage` and that switching is instant (no reload).
8. Audit Navbar, Footer, Dashboard, Marketplace, CattleMarket, VetContacts, MilkRates, Schemes — replace remaining hard-coded English strings with `t()` calls so language toggle actually re-renders them.

### C. Schemes UI polish
9. Redesign `Schemes.tsx` cards: eligibility, benefits, required docs, official apply link, last-updated date — all in a clean card grid with category chips and search.

### D. Small SEO + favicon sanity
10. Verify `index.html` title/description/OG, `robots.txt`, and `sitemap.xml` are consistent with current routes.

## What I am NOT doing this round (and why)

- **Full visual redesign of every page** — needs a design direction round (palette/type/layout picks) before I touch components, or it becomes random restyling.
- **Marketplace category expansion (Goat/Sheep/Duck/Dog/Cat)** — requires schema migration on `cattle_listings.type` enum + new dynamic forms per animal + validation. Worth its own round.
- **Vet revamp (opening hours, specialization filters, ratings polish)** — needs vet schema additions and is a meaningful UI rebuild.
- **Performance pass (image compression on upload, lazy routes, skeletons everywhere, pagination)** — separate round; partial wins are worse than none.
- **Email verification flow / phone OTP via Twilio** — already partially set up; full production hardening (rate limits, abuse) is its own round.
- **Cross-platform manual QA on iOS/Android/Safari** — I can't drive real devices; I'll run Playwright on the preview but real-device QA is on you.

## Suggested next rounds (pick one after this lands)

1. **Design system + redesign** — pick palette/typography/layout, then I restyle Dashboard → Marketplace → CattleMarket → VetContacts → MilkRates → Schemes consistently.
2. **Marketplace expansion** — add Goat/Sheep/Duck/Dog/Cat with per-animal forms, image compression, gallery/video preview, Mark Sold + Report + Share + Directions polished end-to-end.
3. **Vet + Milk Rates production polish** — opening hours, specializations, filters, sorting, comparison view.
4. **Performance & SEO deep pass** — route-level code splitting, image pipeline (`vite-imagetools`), skeletons, pagination, per-route Helmet metadata, JSON-LD.
5. **Auth hardening** — leaked-password check, rate limiting on OTP, session/role edge cases, email verification UX.

Approve and I'll execute Round 1. Tell me which round to queue next.