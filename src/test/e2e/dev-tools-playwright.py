import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/dev-tools-e2e/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type} {msg.text}"))

        print("Navigating to /dev/tools...")
        await page.goto("http://localhost:8080/dev/tools", wait_until="networkidle")
        
        # Inject the mock directly
        with open("public/mock/appbuild-wrapper-sdk.mock.js", "r") as f:
            mock_code = f.read()
        await page.evaluate(mock_code)
        
        # Manually trigger the refreshData function if it didn't find the mock initially
        await page.evaluate("() => { if (window.__REFRESH_DEV_TOOLS__) window.__REFRESH_DEV_TOOLS__(); }")
        
        await page.wait_for_selector("h1:has-text('Developer Tools')", timeout=5000)
        await page.screenshot(path=str(SCREENSHOTS / "01_loaded.png"))
        
        # Test Premium
        print("Testing Premium Toggle...")
        # Check if isPremium is false initially
        initial_premium = await page.evaluate("() => !!document.querySelector('#premium-toggle[data-state=\"checked\"]')")
        print(f"Initial premium: {initial_premium}")
        
        # Click the switch
        await page.click("#premium-toggle")
        await page.wait_for_timeout(2000)
        
        after_premium = await page.evaluate("() => !!document.querySelector('#premium-toggle[data-state=\"checked\"]')")
        print(f"After premium: {after_premium}")
        
        if initial_premium == after_premium:
             print("Click failed to toggle, trying evaluate...")
             await page.evaluate("document.getElementById('premium-toggle').click()")
             await page.wait_for_timeout(2000)
             after_premium = await page.evaluate("() => !!document.querySelector('#premium-toggle[data-state=\"checked\"]')")
             print(f"After evaluate toggle: {after_premium}")

        # Check raw data
        raw_data = await page.locator("pre").first.text_content()
        print(f"Contains isActive true: {'"isActive": true' in raw_data}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
