import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL } from '../test-utils';

describe('Director Reporting & Oversight', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        const setup = await setupBrowser();
        browser = setup.browser;
        page = setup.page;
        await login(page, 'director@example.com');
    });

    afterAll(async () => {
        await browser.close();
    });

    test('should access reports and view submitted forms', async () => {
        await page.goto(`${BASE_URL}/admin/reports`);
        
        // Verify we are on the reports page
        expect(await page.$eval('h1', el => el.innerText)).toContain('Monthly QA Status Report');
        
        // Check for "View Form" buttons in the table
        await page.waitForSelector('a:has-text("View Form")');
        
        // Click the first "View Form" button
        const viewLink = await page.$eval('a:has-text("View Form")', el => (el as HTMLAnchorElement).href);
        
        // Verify it points to the read-only view path (/reviews/[id]/view)
        expect(viewLink).toMatch(/\/reviews\/[a-z0-9-]+\/view$/);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('a:has-text("View Form")')
        ]);
        
        // Verify we are on the view page and NOT redirected to dashboard
        expect(page.url()).toContain('/view');
        expect(await page.content()).toContain('Review Details');
        expect(await page.content()).not.toContain('Edit Review'); // Should not be in admin mode
    });

    test('should be able to add a comment as Director', async () => {
        // Find a review to comment on (we should still be on a view page from previous test)
        await page.waitForSelector('textarea[placeholder*="comment"]');
        const commentText = `Director strategic comment ${Date.now()}`;
        
        await page.type('textarea[placeholder*="comment"]', commentText);
        await page.click('button:has-text("Post Comment")');
        
        // Verify comment appears
        await page.waitForFunction(
            (text) => document.body.innerText.includes(text),
            {},
            commentText
        );
    });
});
