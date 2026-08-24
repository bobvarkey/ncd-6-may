import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

AXE_CORE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js"

async def audit_page(page, route_name):
    print(f"\n--- Auditing {route_name} ---")
    try:
        await page.goto(f"http://localhost:8080{route_name}", wait_until="networkidle")
    except Exception as e:
        print(f"Error navigating to {route_name}: {e}")
        return None
    
    await page.add_script_tag(url=AXE_CORE_URL)
    results = await page.evaluate("axe.run()")
    violations = results.get("violations", [])
    
    images = await page.query_selector_all("img")
    missing_alt = 0
    for img in images:
        alt = await img.get_attribute("alt")
        if not alt:
            missing_alt += 1
            print(f"FAIL: Missing alt text on image: {await img.get_attribute('src')}")
    
    figures = await page.query_selector_all("figure")
    figcaptions = await page.query_selector_all("figcaption")
    
    print(f"Images: {len(images)} (Missing alt: {missing_alt})")
    print(f"Figures: {len(figures)}, Figcaptions: {len(figcaptions)}")
    print(f"Axe Violations: {len(violations)}")
    
    return {
        "route": route_name,
        "missing_alt": missing_alt,
        "violations": len(violations),
        "figures": len(figures),
        "captions": len(figcaptions)
    }

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        routes = ["/vitamin-d", "/gallery"]
        report = []
        for route in routes:
            res = await audit_page(page, route)
            if res:
                report.append(res)

        await browser.close()
        
        print("\n=== Audit Summary ===")
        for r in report:
            status = "PASS" if r['missing_alt'] == 0 else "FAIL"
            print(f"{r['route']}: {status} (Alt: {r['missing_alt']} missing, Captions: {r['captions']})")

if __name__ == '__main__':
    asyncio.run(main())
