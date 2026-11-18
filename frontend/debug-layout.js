import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 730 });
  await page.goto('http://localhost:5173/app/generate', { waitUntil: 'networkidle2' });
  
  // Wait a bit for animations
  await new Promise(resolve => setTimeout(resolve, 1000));

  const layoutInfo = await page.evaluate(() => {
    const getRect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        className: el.className
      };
    };

    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      root: getRect('#root > div'),
      sidebar: getRect('aside'),
      mainWrapper: getRect('.flex-1.flex.flex-col'),
      topbar: getRect('header'),
      main: getRect('main'),
      outletWrapper: getRect('.animate-slide-up'),
      generateLayout: getRect('.flex.flex-col.xl\\:flex-row'),
      leftColumn: getRect('.flex-1.flex.flex-col.gap-5.min-w-0'),
      rightColumn: getRect('.w-full.xl\\:w-\\[360px\\]')
    };
  });

  console.log(JSON.stringify(layoutInfo, null, 2));
  await browser.close();
})();
