import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/dev-tools-debug/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        print("Navigating to /dev/tools...")
        # Navigate and wait for some time to allow lazy loading
        await page.goto("http://localhost:8080/dev/tools", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000) 
        
        await page.screenshot(path=str(SCREENSHOTS / "debug_render.png"))
        
        url = page.url
        print(f"Current URL: {url}")
        
        # Log all text content to see if we're hitting a 404 or something else
        content = await page.content()
        print(f"Page content length: {len(content)}")
        
        # Check for specific text
        h1s = await page.locator("h1").all_text_contents()
        print(f"H1 elements: {h1s}")
        
        # Check if the mock is actually there
        mock_exists = await page.evaluate("() => !!window.AppbuildWrapper")
        print(f"window.AppbuildWrapper exists: {mock_exists}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
