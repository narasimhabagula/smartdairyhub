# Smart Dairy Hub — Premium Redesign Plan

Your app already has the core modules built: Dashboard, Milk Rates, Marketplace, Cattle Market, Vet Contacts, Schemes, Jerry AI, Auth, Admin, etc. The gap is **visual craft + polish**, not new backend. This plan is a phased design + UX overhaul — one phase per turn — so we can ship real quality instead of a rushed mega-rewrite.

## What I will NOT rebuild
These already exist and work; I'll only re-skin them:
- Supabase auth (email + Google + OTP) ✓
- Jerry AI chatbot with voice ✓
- Milk rate DB + realtime feed ✓
- Marketplace / cattle listings / vet directory / schemes ✓
- Notifications, orders, payments scaffolding ✓

## What I WILL do

### Phase 1 — Design foundation + Home (this turn if you approve)
The single highest-leverage change. Sets the visual language every other page inherits.
- New design tokens in `index.css` + `tailwind.config.ts`:
  - White canvas, primary green `#22C55E` + darker `#15803D`, cream accent, ink `#0F172A`
  - 24px card radius, glass surfaces, soft layered shadows, generous spacing scale
  - Type: Playfair Display (display) + Inter (body) — already loaded, tightened scale
  - Motion tokens (easing, durations) + `animate-fade-in` / `scale-in` / parallax
- New `Home` (Index) page:
  - Full-bleed hero with drone-style farm photo, glass search bar, 3 CTAs (Get Started / AI Disease Detection / Download App)
  - Animated stats strip (100k+ Farmers, 50k+ Cattle, 10M+ Records, 24/7 AI)
  - Feature bento grid linking to Milk Rates, Disease Detection, Vets, Marketplace, Schemes
  - Testimonials + trust logos, premium footer
- Global `Navbar` refresh (glass, sticky, mobile drawer with the full menu you listed)
- Global `Footer` refresh

### Phase 2 — AI Disease Detection (new feature)
This is the "main feature" from your brief and doesn't exist yet.
- New `/disease-detection` route with ChatGPT-style upload:
  - Drag-drop + camera + gallery, multi-image, preview with zoom/delete/replace, progress bar
  - Calls a new `analyze-animal-health` edge function → Lovable AI Gateway (Gemini vision)
  - Returns structured: disease, confidence, severity, symptoms, causes, medicine, feed, vitamins, isolation advice, nearest vet CTA, emergency button, downloadable PDF report
  - Saves history to a new `disease_reports` table (RLS: farmer-owned)

### Phase 3 — Dashboard redesign
Animated stat cards, Recharts graphs, weather widget, AI suggestions feed, notification stream — all on the new tokens.

### Phase 4 — Milk Rates + Milk Calculator redesign
Live-price hero graph, filter chips, comparison cards. Keep existing data + realtime logic.

### Phase 5 — Marketplace + Cattle Market + Feed Store redesign
Airbnb-style listing cards, sticky filters, favorites, verified badges, WhatsApp/call CTAs.

### Phase 6 — Vet Directory + Booking redesign
Doctor profile cards with rating, fee, map pin, book/call/chat/video call CTAs.

### Phase 7 — Schemes + Community + Profile polish
Scheme eligibility checker UI, community feed, profile settings hub.

## Technical notes
- All colors go through semantic tokens — no hardcoded `bg-green-500` in components.
- New AI vision call uses existing Lovable AI Gateway (`LOVABLE_API_KEY` already set); no new secrets.
- All new tables get `GRANT` + RLS in the same migration.
- I'll use AI Elements for the disease-detection chat/upload surface.
- Framer Motion for hero/parallax animations (bounded — no perf tax).
- Existing routes and data stay intact; this is additive + re-skin.

## Question before I start
Which phase do you want first?
1. **Phase 1 (design system + Home)** — recommended, unlocks the rest
2. **Phase 2 (AI Disease Detection)** — new hero feature, skip re-skin for now
3. **All phases sequentially** — approve once, I'll ship phase 1 now and continue in follow-up turns

Reply with the phase number (or "1 then 2") and I'll start immediately.
