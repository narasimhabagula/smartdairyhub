# One banner set: desktop banners reused on mobile

## What changes

1. **AI Scan banner** — your uploaded image becomes the banner on the AI Disease Detection page, on both desktop and mobile. Nothing about the image is redrawn or regenerated.
2. **Same banners everywhere** — the separate mobile picture strips (with the back arrow and white text over the photo) are removed from Milk Rates, Cattle Market, Vet, Schemes, Feed & Supplies and AI Scan. Each page then shows the one desktop banner, scaled down on phones so the whole picture is visible.
3. **Nothing else** — no layout, colour, font, navigation, data or functionality changes. Existing desktop appearance stays identical.

## How the mobile sizing works

The shared banner block becomes visible at all widths instead of desktop-only:
- full width of the page, side padding on phones so it doesn't touch the edges
- height follows the picture's own proportions (no fixed height, no cropping, no stretching)
- rounded frame and soft shadow kept as today
- no horizontal scrolling, no text overlaid on the picture

## One thing to confirm

The image you uploaded is a screenshot of the whole AI Scan page — it includes the top navigation bar, the upload box and the "What You Get" row underneath the banner area. If I place it in full, the page would show a second navigation bar and a second upload box inside the picture. My plan is to use the banner portion of that screenshot (the green card with the cow, the phone and the four stats) at its full height, without altering the artwork itself. Tell me if you'd rather have the entire screenshot placed as-is.

## Technical notes

- Upload the reference image via `lovable-assets` into `src/assets/hero-aiscan-v2.<ext>.asset.json`.
- `src/components/PageBanner.tsx`: drop `hidden md:block`, keep `container`, add mobile padding; image stays `w-full h-auto` (aspect intact).
- Remove `<MobilePageHero />` usage and imports from `MilkRates.tsx`, `CattleMarket.tsx`, `Schemes.tsx`, `VetContacts.tsx`, `Marketplace.tsx`, `DiseaseDetection.tsx`; delete `MobilePageHero.tsx` once unreferenced.
- `DiseaseDetection.tsx`: replace the current photo/text hero section (lines ~179–198) with `<PageBanner image={aiScanBanner.url} … />`; the Upload/Try Demo buttons stay reachable through the existing upload card below.
- `Marketplace.tsx`: replace the custom overlay hero with `PageBanner` using the existing `banner-marketplace.jpg`; keep the Medical Store strip and the Shop Now action in the section below untouched.
- Verify with a build plus mobile (390px) and desktop (1280px) screenshots of all six pages.
