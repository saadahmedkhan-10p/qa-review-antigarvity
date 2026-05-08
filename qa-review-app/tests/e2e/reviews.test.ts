import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL, delay } from '../test-utils';

describe('Review Lifecycle Flow', () => {
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

    test('should complete a full review lifecycle', async () => {
        // 1. Admin Initiates Review Cycle
        await login(page, 'admin@example.com');
        await page.goto(`${BASE_URL}/admin/projects`);
        
        await page.waitForSelector('button:has-text("Start Review Cycle")');
        // Select a form and reviewer (assuming first ones available)
        await page.select('select[name="formId"]', await page.$eval('select[name="formId"] option:nth-child(2)', (el: any) => el.value));
        
        await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/reviews') && res.status() === 200),
            page.click('button:has-text("Start Review Cycle")')
        ]);
        
        // 2. Reviewer Conducts Review
        const client = await page.createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await login(page, 'reviewer@example.com');
        
        await page.goto(`${BASE_URL}/reviewer/dashboard`);
        // Find the pending review
        await page.waitForSelector('a:has-text("Conduct Review")');
        await page.click('a:has-text("Conduct Review")');
        
        // Fill out form (answering at least one question)
        await page.waitForSelector('textarea, input[type="radio"]');
        const textareas = await page.$$('textarea');
        if (textareas.length > 0) {
            await textareas[0].type('Test observation from automated reviewer');
        }
        
        // Submit
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button:has-text("Submit Review")')
        ]);
        
        expect(await page.content()).toContain('Review submitted successfully');

        // 3. Admin Updates Review (Observations & Health)
        await client.send('Network.clearBrowserCookies');
        await login(page, 'admin@example.com');
        await page.goto(`${BASE_URL}/admin/reviews`);
        
        // Find the newly submitted review
        await page.waitForSelector('a:has-text("Edit")');
        await page.click('a:has-text("Edit")');
        
        await page.waitForSelector('select[value="On Track"]');
        await page.select('select', 'Slightly Challenged');
        await page.type('textarea[placeholder*="Key findings"]', 'Admin follow-up observation');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button:has-text("Update Review")')
        ]);
        
        expect(await page.content()).toContain('Review updated successfully');
    });
});
