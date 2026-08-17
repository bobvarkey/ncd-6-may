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

        # Listen for console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type} {msg.text}"))

        print("Navigating to Home...")
        await page.goto("http://localhost:8080/", wait_until="networkidle")
        
        print("Injecting mock into global window...")
        # We read the mock content and evaluate it to ensure it's defined
        # This bypasses any script loading/caching issues in the sandbox
        with open("public/mock/appbuild-wrapper-sdk.mock.js", "r") as f:
            mock_code = f.read()
        
        await page.evaluate(mock_code)
        
        # Verify injection
        exists = await page.evaluate("() => !!window.AppbuildWrapper")
        print(f"window.AppbuildWrapper exists after evaluation: {exists}")

        print("Navigating to Developer Tools...")
        # In a SPA, we should try to navigate via the router to keep the window state
        # Or just goto and re-evaluate if it's not a SPA or resets state
        await page.goto("http://localhost:8080/dev/tools", wait_until="networkidle")
        
        # Re-verify/re-inject if needed (goto resets JS state)
        await page.evaluate(mock_code)
        
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(SCREENSHOTS / "check_render.png"))
        
        headings = await page.evaluate("() => Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText)")
        print(f"Headings found: {headings}")
        
        if 'Mock SDK Not Found' in headings:
             print("DEBUG: Still seeing fallback. Checking window.AppbuildWrapper...")
             status = await page.evaluate("() => ({ exists: !!window.AppbuildWrapper, keys: window.AppbuildWrapper ? Object.keys(window.AppbuildWrapper) : [] })")
             print(f"Status at /dev/tools: {status}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
