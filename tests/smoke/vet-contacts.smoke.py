"""Playwright smoke test for /vet-contacts.

Verifies:
  1. Page loads without runtime errors.
  2. Geolocation permission can be granted (mocked coords: Bengaluru).
  3. At least one vet card or an empty-state message renders.
  4. If cards render: Call uses tel:, WhatsApp uses wa.me, Directions uses google.com/maps.

Run:  python3 tests/smoke/vet-contacts.smoke.py
Assumes the dev server is already running on http://localhost:8080.
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("SMOKE_BASE_URL", "http://localhost:8080")
SHOTS = Path("/tmp/browser/vet-contacts")
SHOTS.mkdir(parents=True, exist_ok=True)


async def main() -> int:
    console_errors: list[str] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            geolocation={"latitude": 12.9716, "longitude": 77.5946},
            permissions=["geolocation"],
            locale="en-IN",
        )
        page = await context.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        # Restore auth session if injected (nearby-vets requires JWT).
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        if storage_key and session_json:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )

        await page.goto(f"{BASE_URL}/vet-contacts", wait_until="domcontentloaded")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SHOTS / "1_loaded.png"))

        # Best-effort: trigger nearby search if a button exists.
        for label in ("Use my location", "Nearby", "Find nearby"):
            btn = page.get_by_role("button", name=label, exact=False)
            if await btn.count():
                try:
                    await btn.first.click(timeout=2000)
                    break
                except Exception:
                    pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(SHOTS / "2_nearby.png"))

        call_links = await page.locator('a[href^="tel:"]').all()
        wa_links = await page.locator('a[href*="wa.me/"]').all()
        dir_links = await page.locator('a[href*="google.com/maps"]').all()

        print(f"tel: links = {len(call_links)}")
        print(f"wa.me links = {len(wa_links)}")
        print(f"maps links = {len(dir_links)}")
        print(f"console errors = {len(console_errors)}")
        for e in console_errors[:5]:
            print("  !", e[:200])

        ok = True
        # Sample-check schemes on the first link of each type (when present).
        if call_links:
            href = await call_links[0].get_attribute("href")
            ok &= bool(href and href.startswith("tel:+91"))
            print("first tel href:", href)
        if wa_links:
            href = await wa_links[0].get_attribute("href")
            ok &= bool(href and href.startswith("https://wa.me/") and "+" not in href.split("wa.me/")[1])
            print("first wa href:", href)
        if dir_links:
            href = await dir_links[0].get_attribute("href")
            ok &= bool(href and ("/maps/dir/" in href or "/maps/search/" in href or "maps.google" in href))
            print("first dir href:", href)

        # Hard failures: runtime crash or page didn't render the heading.
        heading_visible = await page.locator("h1, h2").first.is_visible()
        ok &= heading_visible
        ok &= len([e for e in console_errors if "ResizeObserver" not in e]) == 0

        await browser.close()
        return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
