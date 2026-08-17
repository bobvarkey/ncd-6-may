import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Testing direct access to mock script...")
        response = await page.goto("http://localhost:8080/mock/appbuild-wrapper-sdk.mock.js")
        print(f"Status: {response.status}")
        print(f"Content length: {len(await response.text())}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
