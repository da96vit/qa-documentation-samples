// Captures screenshot evidence for the bug reports in docs/Bug-Reports.md.
// Usage: node scripts/capture-evidence.js
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE = 'https://www.saucedemo.com';
const OUT = path.join(__dirname, '..', 'docs', 'evidence');

async function login(page, user) {
  await page.goto(BASE);
  await page.fill('[data-test=username]', user);
  await page.fill('[data-test=password]', 'secret_sauce');
  await page.click('[data-test=login-button]');
  await page.waitForURL(/inventory/);
}

const shot = (page, name) => page.screenshot({ path: path.join(OUT, name) });

(async () => {
  const browser = await chromium.launch();
  // A fresh context per user so carts saved in localStorage don't leak between users.
  const freshPage = async () =>
    (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

  // BUG-001: problem_user sees the same image for every product.
  let page = await freshPage();
  await login(page, 'problem_user');
  await page.waitForTimeout(800);
  await shot(page, 'BUG-001-same-product-images.png');

  // BUG-005: typing a last name overwrites the first name field.
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.goto(`${BASE}/checkout-step-one.html`);
  await page.fill('[data-test=firstName]', 'Davit');
  await page.fill('[data-test=lastName]', 'Tester');
  await page.fill('[data-test=postalCode]', '0179');
  await page.click('[data-test=continue]');
  await page.waitForTimeout(500);
  await shot(page, 'BUG-005-last-name-overwrites-first-name.png');

  // BUG-009: error_user cannot finish the order.
  page = await freshPage();
  page.on('dialog', (d) => d.dismiss());
  await login(page, 'error_user');
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.goto(`${BASE}/checkout-step-one.html`);
  await page.fill('[data-test=firstName]', 'Davit');
  await page.fill('[data-test=postalCode]', '0179');
  await page.click('[data-test=continue]');
  await page.waitForURL(/step-two/);
  await page.click('[data-test=finish]');
  await page.waitForTimeout(800);
  await shot(page, 'BUG-009-finish-does-nothing.png');

  // BUG-010: visual_user sees wrong prices on the product list.
  page = await freshPage();
  await login(page, 'visual_user');
  await page.waitForTimeout(800);
  await shot(page, 'BUG-010-wrong-prices.png');

  await browser.close();
  console.log('Evidence saved to', OUT);
})();
