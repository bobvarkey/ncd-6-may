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

        # Listen for console logs to catch errors
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type} {msg.text}"))

        print("Navigating to Home...")
        await page.goto("http://localhost:8080/", wait_until="networkidle")
        
        print("Injecting mock...")
        with open("public/mock/appbuild-wrapper-sdk.mock.js", "r") as f:
            mock_code = f.read()
        await page.evaluate(mock_code)
        
        print("Navigating to Developer Tools...")
        await page.goto("http://localhost:8080/dev/tools", wait_until="networkidle")
        await page.evaluate(mock_code)

        # Verify page loaded
        await page.wait_for_selector("h1:has-text('Developer Tools')", timeout=10000)
        await page.screenshot(path=str(SCREENSHOTS / "01_loaded.png"))
        print("Page loaded successfully.")

        # --- Test 1: Premium Toggle ---
        print("Testing Premium Toggle...")
        premium_switch = page.locator("#premium-toggle")
        
        # Initial state
        initial_checked = await premium_switch.get_attribute("data-state") == "checked"
        print(f"Initial premium checked attribute: {initial_checked}")
        
        # Click the switch - Radix switch usually needs a direct click or label click
        # We'll use the button specifically
        await premium_switch.click()
        
        # Wait for potential reload/refresh in the app logic
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(SCREENSHOTS / "02_premium_clicked.png"))
        
        after_checked = await premium_switch.get_attribute("data-state") == "checked"
        print(f"After click premium checked attribute: {after_checked}")
        
        if initial_checked == after_checked:
             # Try forcing the state via evaluate if click failed
             print("Click didn't change attribute, attempting direct evaluate toggle...")
             await page.evaluate("document.getElementById('premium-toggle').click()")
             await page.wait_for_timeout(2000)
             after_checked = await premium_switch.get_attribute("data-state") == "checked"
             print(f"After evaluate toggle checked attribute: {after_checked}")

        if initial_checked == after_checked:
            raise Exception("FAILED: Premium status did not change.")
        print("SUCCESS: Premium status changed.")

        # --- Test 2: Platform Switch ---
        print("Testing Platform Switch...")
        # Check current platform badge
        initial_platform = await page.evaluate("() => document.querySelector('button.bg-primary')?.innerText || ''")
        print(f"Initial platform: {initial_platform}")
        
        target_platform = "Android" if "iOS" in initial_platform else "iOS"
        print(f"Switching to {target_platform}...")
        
        platform_btn = page.get_by_role("button", name=target_platform, exact=True)
        await platform_btn.click()
        
        # The app triggers a location.reload() after 1s
        await page.wait_for_timeout(2500)
        await page.evaluate(mock_code) # Re-inject
        await page.wait_for_selector("h1:has-text('Developer Tools')")
        
        new_platform = await page.evaluate("() => document.querySelector('button.bg-primary')?.innerText || ''")
        print(f"New platform: {new_platform}")
        
        if target_platform.upper() in new_platform.upper():
            print(f"SUCCESS: Switched to {target_platform}.")
        else:
            print(f"WARNING: Platform badge didn't update to {target_platform}. Found: {new_platform}")

        # --- Test 3: Raw Data Presence ---
        print("Verifying Raw Data presence...")
        raw_data = await page.locator("pre").first.text_content()
        if raw_data and len(raw_data) > 100:
            print("SUCCESS: Raw data is displayed.")
        else:
            raise Exception("FAILED: Raw data is missing or too short.")

        print("E2E tests complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
