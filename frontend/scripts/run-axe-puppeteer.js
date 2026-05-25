const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const axeCore = require('axe-core');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8000/webpage.html';
  const out = process.argv[3] || path.resolve(process.cwd(), 'axe-puppeteer-report.json');

  console.log(`Launching browser and scanning: ${url}`);

  let browser;
  try {
    const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Inject axe
    await page.evaluate(axeCore.source);
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa', 'wcag21aa'] } });
    });

    fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Saved axe report to ${out}`);
  } catch (err) {
    console.error('Error running axe-puppeteer:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
