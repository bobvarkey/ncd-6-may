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
        # Set a larger viewport to see everything
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        print("Navigating to Developer Tools...")
        await page.goto("http://localhost:8080/dev/tools", wait_until="networkidle")
        
        # Verify page loaded
        await page.wait_for_selector("h1:has-text('Developer Tools')")
        await page.screenshot(path=str(SCREENSHOTS / "01_loaded.png"))
        print("Page loaded successfully.")

        # --- Test 1: Premium Toggle ---
        print("Testing Premium Toggle...")
        premium_switch = page.locator("#premium-toggle")
        
        # Initial state should be false (unless persisted)
        is_premium_initial = await premium_switch.is_checked()
        print(f"Initial premium status: {is_premium_initial}")
        
        # Toggle it
        await premium_switch.click()
        await page.wait_for_timeout(500) # Wait for state update
        await page.screenshot(path=str(SCREENSHOTS / "02_premium_toggled.png"))
        
        is_premium_after = await premium_switch.is_checked()
        print(f"Premium status after toggle: {is_premium_after}")
        
        if is_premium_initial == is_premium_after:
            print("FAILED: Premium status did not change.")
        else:
            print("SUCCESS: Premium status changed.")

        # Verify raw data update
        raw_data = await page.locator("pre").text_content()
        if is_premium_after:
            if '"isActive": true' in raw_data:
                print("SUCCESS: Raw data reflects active entitlement.")
            else:
                print("FAILED: Raw data does not reflect active entitlement.")
        else:
            if '"isActive": true' not in raw_data:
                print("SUCCESS: Raw data reflects inactive entitlement.")
            else:
                print("FAILED: Raw data still shows active entitlement.")

        # --- Test 2: Platform Switch ---
        print("Testing Platform Switch...")
        # Get current platform badge text or button state
        ios_button = page.get_by_role("button", name="iOS")
        android_button = page.get_by_role("button", name="Android")
        
        # Click Android
        print("Switching to Android...")
        await android_button.click()
        # The app reloads on platform change (per DevTools.tsx:85)
        await page.wait_for_url("**/dev/tools")
        await page.wait_for_selector("h1:has-text('Developer Tools')")
        await page.screenshot(path=str(SCREENSHOTS / "03_platform_android.png"))
        
        # Verify platform badge or raw data
        # In the mock, platform affects the 'store' in entitlements: APP_STORE vs PLAY_STORE
        # But let's check the button state in UI
        is_android_active = await android_button.get_attribute("class")
        if "bg-primary" in is_android_active or "default" in is_android_active: # Shadcn default variant usually has primary bg
             print("SUCCESS: Android button appears active.")
        else:
             print("Note: Android button state check might be fragile due to CSS classes.")

        # --- Test 3: Reset Data ---
        print("Testing Reset Data...")
        reset_button = page.get_by_role("button", name="Reset All Mock Data")
        await reset_button.click()
        
        # Wait for reload
        await page.wait_for_url("**/dev/tools")
        await page.wait_for_selector("h1:has-text('Developer Tools')")
        await page.screenshot(path=str(SCREENSHOTS / "04_after_reset.png"))
        
        # Verify premium is off after reset
        is_premium_reset = await page.locator("#premium-toggle").is_checked()
        print(f"Premium status after reset: {is_premium_reset}")
        if not is_premium_reset:
            print("SUCCESS: Reset cleared premium status.")
        else:
            print("FAILED: Reset did not clear premium status.")

        print("E2E tests complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
