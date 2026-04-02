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
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    if (urlPath) {
      await page.goto(`http://localhost:3000${urlPath}`, { waitUntil: 'networkidle2' });
    }

    // Wait extra seconds to ensure table elements load
    await new Promise(r => setTimeout(r, 2000));

    const outPath = path.join(docsDir, filename);
    await page.screenshot({ path: outPath });
    console.log(`✅ Saved screenshot: public/docs/${filename}`);
  }

  try {
    await loginAndScreenshot('reviewer@example.com', '/reviewer/dashboard', 'conduct_review_flow.png');
  } catch(e) {
    console.error('Error during capture:', e);
  } finally {
    await browser.close();
  }
}

capture();
