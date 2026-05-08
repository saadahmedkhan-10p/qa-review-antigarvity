import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL, delay } from '../test-utils';

describe('@Mentions & Notifications', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        const setup = await setupBrowser();
        browser = setup.browser;
        page = setup.page;
    });

    afterAll(async () => {
        await browser.close();
    });

    test('should notify a user when they are @mentioned in a comment', async () => {
        // 1. Admin mentions the Director
        await login(page, 'admin@example.com');
        await page.goto(`${BASE_URL}/admin/reviews`);
        await page.waitForSelector('a[href*="/admin/reviews/"]');
        
        // Go to first available review
        const reviewUrl = await page.$eval('a[href*="/admin/reviews/"]', el => (el as HTMLAnchorElement).href);
        await page.goto(reviewUrl);
        
        const mentionText = `Hey @Director dummy, please check this. ${Date.now()}`;
        await page.waitForSelector('textarea[placeholder*="comment"]');
        await page.type('textarea[placeholder*="comment"]', mentionText);
        
        await Promise.all([
            page.waitForResponse(res => res.url().includes('/comments') && res.status() === 200),
            page.click('button:has-text("Post Comment")')
        ]);
        
        // 2. Log in as Director and check notification
        const client = await page.createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await login(page, 'director@example.com');
        
        // Wait for polling or just refresh
        await page.goto(`${BASE_URL}/director/dashboard`);
        
        // Click the notification bell
        await page.waitForSelector('button[aria-label="Notifications"]');
        await page.click('button[aria-label="Notifications"]');
        
        // Verify the mention notification is present
        await page.waitForFunction(
            (text) => document.body.innerText.includes('tagged you in a comment'),
            { timeout: 5000 }
        );
        
        expect(await page.content()).toContain('tagged you in a comment');
    });
});
