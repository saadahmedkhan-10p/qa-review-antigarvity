import { Browser, Page } from 'puppeteer';
import { setupBrowser, login, BASE_URL, delay } from '../test-utils';

describe('Admin Project Management', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        const setup = await setupBrowser();
        browser = setup.browser;
        page = setup.page;
        await login(page, 'admin@example.com');
    });

    afterAll(async () => {
        await browser.close();
    });

    test('should create a new project', async () => {
        await page.goto(`${BASE_URL}/admin/projects`);
        
        // Open create project form if it's in a modal or section
        // Based on previous code, it's a section on the right
        const projectName = `Test Project ${Date.now()}`;
        
        await page.waitForSelector('input[placeholder="Project Name"]');
        await page.type('input[placeholder="Project Name"]', projectName);
        await page.type('textarea[placeholder="Project Description"]', 'Automated test project description');
        
        // Select type
        await page.select('select[name="type"]', 'MANUAL');
        
        // Submit
        await page.click('button:has-text("Create Project")');
        
        // Verify project appears in table
        await page.waitForFunction(
            (name) => document.body.innerText.includes(name),
            {},
            projectName
        );
    });

    test('should edit an existing project', async () => {
        await page.goto(`${BASE_URL}/admin/projects`);
        
        // Find an Edit button for a project
        await page.waitForSelector('a[href*="/admin/projects/"]');
        const editLink = await page.$eval('a[href*="/edit"]', el => (el as HTMLAnchorElement).href);
        await page.goto(editLink);
        
        await page.waitForSelector('input[name="name"]');
        const updatedName = `Updated Project ${Date.now()}`;
        
        // Clear and type new name
        await page.click('input[name="name"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('input[name="name"]', updatedName);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[type="submit"]'),
        ]);
        
        expect(page.url()).toContain('/admin/projects');
        expect(await page.content()).toContain(updatedName);
    });
});
