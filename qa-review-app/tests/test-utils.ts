import puppeteer, { Browser, Page } from 'puppeteer';

export const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

export async function setupBrowser() {
    const browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(60000);
    return { browser, page };
}

export async function login(page: Page, email: string, password: string = 'password123') {
    await page.goto(BASE_URL);
    
    // Check if we are already logged in (look for navbar logout button)
    const logoutBtn = await page.$('button[onclick*="logout"]');
    if (logoutBtn) {
        // Simple way to logout if needed, or just proceed if session is fine
        // For E2E tests, it's better to clear cookies
        const client = await page.createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await page.goto(BASE_URL);
    }

    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]'),
    ]);
}

export async function logout(page: Page) {
    // Assuming there is a logout button in the Navbar
    // If not accessible easily, we can just clear cookies
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.goto(BASE_URL);
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
