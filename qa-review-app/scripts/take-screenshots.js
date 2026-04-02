const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const docsDir = path.join(__dirname, '../public/docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  async function loginAndScreenshot(email, urlPath, filename) {
    console.log(`Logging in as ${email}...`);
    
    // Clear cookies for fresh login
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Input credentials
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');

    console.log(`Waiting for navigation to dashboard for ${email}...`);
    // Wait for the URL to change from the login page
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Explicitly navigate to the requested path if different
    if (urlPath) {
      console.log(`Navigating to ${urlPath}...`);
      await page.goto(`http://localhost:3000${urlPath}`, { waitUntil: 'networkidle2' });
    }

    // Wait a brief moment for any dynamic data to fetch
    await new Promise(r => setTimeout(r, 1500));

    const outPath = path.join(docsDir, filename);
    await page.screenshot({ path: outPath });
    console.log(`✅ Saved screenshot: public/docs/${filename}`);
  }

  try {
    await loginAndScreenshot('admin@example.com', '/admin/reports', 'admin_dashboard.png');
    await loginAndScreenshot('qa.manager@example.com', '/qa-manager/dashboard', 'qa_manager_projects.png');
    await loginAndScreenshot('reviewer@example.com', '/reviewer/dashboard', 'reviewer_dashboard.png');
  } catch(e) {
    console.error('Error during capture:', e);
  } finally {
    await browser.close();
  }
}

capture();
