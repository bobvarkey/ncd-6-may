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
        page = await browser.new_page()

        print("Navigating to Home...")
        await page.goto("http://localhost:8080/", wait_until="domcontentloaded")
        
        print("Injecting mock...")
        await page.evaluate("""
            async () => {
                const script = document.createElement('script');
                script.src = '/mock/appbuild-wrapper-sdk.mock.js';
                script.async = false;
                document.head.appendChild(script);
                for (let i = 0; i < 50; i++) {
                    if (window.AppbuildWrapper) break;
                    await new Promise(r => setTimeout(r, 100));
                }
            }
        """)
        
        print("Navigating to /dev/tools via evaluate...")
        # Use location.assign to avoid full reload if possible, but usually a SPA nav is better
        # Since we are in E2E, we'll just goto it.
        await page.goto("http://localhost:8080/dev/tools", wait_until="networkidle")
        
        await page.screenshot(path=str(SCREENSHOTS / "debug_page.png"))
        
        # Dump all text to see what's actually there
        content = await page.content()
        print(f"Page content snippet: {content[:500]}...")
        
        # Find all headings
        headings = await page.evaluate("() => Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText)")
        print(f"Headings found: {headings}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
