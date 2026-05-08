import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL } from '../test-utils';

describe('Multi-Role Commenting Interaction', () => {
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

    test('should allow different roles to comment on the same review', async () => {
        // 1. Get a review ID to work with (from admin list)
        await login(page, 'admin@example.com');
        await page.goto(`${BASE_URL}/admin/reviews`);
        await page.waitForSelector('a[href*="/admin/reviews/"]');
        const reviewUrl = await page.$eval('a[href*="/admin/reviews/"]', el => (el as HTMLAnchorElement).href);
        const reviewId = reviewUrl.split('/').pop();
        
        const testReviewPath = `/admin/reviews/${reviewId}`;
        const viewReviewPath = `/reviews/${reviewId}/view`;

        // 2. Admin adds a comment
        await page.goto(`${BASE_URL}${testReviewPath}`);
        const adminComment = 'Admin technical comment';
        await page.waitForSelector('textarea[placeholder*="comment"]');
        await page.type('textarea[placeholder*="comment"]', adminComment);
        await page.click('button:has-text("Post Comment")');
        await delay(1000);

        // 3. Director adds a comment
        const client = await page.createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await login(page, 'director@example.com');
        await page.goto(`${BASE_URL}${viewReviewPath}`);
        const directorComment = 'Director strategic feedback';
        await page.waitForSelector('textarea[placeholder*="comment"]');
        await page.type('textarea[placeholder*="comment"]', directorComment);
        await page.click('button:has-text("Post Comment")');
        await delay(1000);

        // 4. Verify both comments are visible to the Reviewer
        await client.send('Network.clearBrowserCookies');
        await login(page, 'reviewer@example.com');
        await page.goto(`${BASE_URL}${viewReviewPath}`);
        
        await page.waitForSelector('.comments-list'); // Assuming a container class
        const content = await page.content();
        expect(content).toContain(adminComment);
        expect(content).toContain(directorComment);
    });
});
