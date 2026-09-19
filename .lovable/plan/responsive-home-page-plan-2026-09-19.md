# Responsive Home Page Plan

## Scope
Update only the home-page implementations (`MobileHome`, `DesktopHome`, and the home route wrapper if needed). Do not change shared navigation, footer, global styles, other pages, routing, authentication, backend, or APIs.

## Implementation
- Rebuild the mobile home header inside `MobileHome` only:
  - Keep the Smart Dairy Hub logo and name.
  - Keep search and language selection available.
  - Show a touch-friendly sign-in/account action and a hamburger menu without affecting shared headers on other pages.
  - Ensure the header fits from 320px upward without horizontal scrolling.
- Add a true mobile hero using the existing home imagery and content, in this exact flow:
  1. AI-powered badge
  2. Main heading
  3. Description
  4. Explore Marketplace button
  5. Farmer Sign In / Dashboard button
  6. Feature highlights
  7. Full-width rotating promotional image card
- Preserve existing home sections below the hero and avoid changing their content or behavior.
- Keep the current desktop presentation visually intact.
- Improve only home-specific tablet behavior so the hero reflows naturally and the promotional card remains visible between 768px and 1023px.
- Use responsive utility classes scoped inside the home components; no global CSS or shared-component styling changes.

## Responsive Details
- Mobile (320–767px): single column, 16–20px side spacing, naturally growing height, stacked full-width buttons, readable type, stable image aspect ratio, and non-overlapping carousel controls.
- Tablet (768–1023px): single-column hero with comfortable width and the promotional card below the copy.
- Laptop (1024–1439px): retain the existing two-column desktop hero.
- Desktop (1440px+): preserve the current layout, imagery, typography, spacing, and interactions as closely as possible.

## Verification
- Check the home page at 320, 360, 375, 390, 414, 768, 1024, and 1440px.
- Confirm no horizontal overflow, clipping, distorted images, button overflow, or carousel-control overlap.
- Confirm search, language, sign-in/account, hamburger menu, hero buttons, and promotional carousel still work.
- Spot-check representative non-home pages to confirm they are visually unchanged.
- Confirm the preview build remains healthy.
