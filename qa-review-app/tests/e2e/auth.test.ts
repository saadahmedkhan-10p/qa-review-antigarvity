import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL } from '../test-utils';

describe('Authentication & Role Redirection', () => {
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

    const rolesToTest = [
        { email: 'admin@example.com', expectedPath: '/admin/reports' },
        { email: 'director@example.com', expectedPath: '/director/dashboard' },
        { email: 'reviewer@example.com', expectedPath: '/reviewer/dashboard' },
        { email: 'qa.manager@example.com', expectedPath: '/qa-manager/dashboard' },
        { email: 'pm@example.com', expectedPath: '/pm/dashboard' },
    ];

    for (const role of rolesToTest) {
        test(`should login successfully as ${role.email} and redirect to ${role.expectedPath}`, async () => {
            await login(page, role.email);
            const url = page.url();
            expect(url).toContain(role.expectedPath);
            
            // Cleanup: clear cookies for next role
            const client = await page.createCDPSession();
            await client.send('Network.clearBrowserCookies');
        });
    }

    test('should show error for invalid credentials', async () => {
        await page.goto(BASE_URL);
        await page.waitForSelector('input[name="email"]');
        await page.type('input[name="email"]', 'wrong@example.com');
        await page.type('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Check for toast or error message
        // react-hot-toast usually has a specific class or we can check for text
        await page.waitForFunction(
            () => document.body.innerText.includes('Invalid email or password'),
            { timeout: 5000 }
        );
    });
});
