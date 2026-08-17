import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating to /dev/tools...")
        await page.goto("http://localhost:8080/dev/tools", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # Check network requests for the mock script
        script_request = None
        async with page.expect_request("**/appbuild-wrapper-sdk.mock.js") as request_info:
             # Force a reload or just wait? If it's already injected it might be too late
             pass
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
