import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 730 });
  await page.goto('http://localhost:5173/app/generate', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'local_screenshot.png' });
  await browser.close();
  console.log('Screenshot saved as local_screenshot.png');
})();
