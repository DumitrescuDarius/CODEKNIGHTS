const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/test-calc.html');
  const w1 = await page.evaluate(() => document.querySelectorAll('.window')[0].getBoundingClientRect());
  const w2 = await page.evaluate(() => document.querySelectorAll('.window')[1].getBoundingClientRect());
  const c = await page.evaluate(() => document.querySelector('.container').getBoundingClientRect());
  console.log("Container:", c.width);
  console.log("Window 1:", w1.right);
  console.log("Window 2:", w2.left);
  console.log("Gap size:", w2.left - w1.right);
  await browser.close();
})();
