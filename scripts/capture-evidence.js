// Reproduces every defect in docs/03-Bug-Reports.md, saves screenshot evidence to docs/evidence/
// and writes what was observed (URLs, console errors, dialogs, timings) to docs/evidence/evidence-log.json.
// Usage: node scripts/capture-evidence.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE = 'https://www.saucedemo.com';
const OUT = path.join(__dirname, '..', 'docs', 'evidence');
const log = {};

async function login(page, user) {
  await page.goto(BASE);
  await page.fill('[data-test=username]', user);
  await page.fill('[data-test=password]', 'secret_sauce');
  const t0 = Date.now();
  await page.click('[data-test=login-button]');
  await page.waitForSelector('[data-test=inventory-item]');
  return Date.now() - t0;
}

const shot = (page, name) => page.screenshot({ path: path.join(OUT, name) });
const badge = async (p) => ((await p.$('[data-test=shopping-cart-badge]')) ? p.textContent('[data-test=shopping-cart-badge]') : 'none');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  // A fresh context per scenario so carts saved in localStorage don't leak between runs.
  const freshPage = async () => {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    page.errors = [];
    page.dialogs = [];
    page.on('pageerror', (e) => page.errors.push(`${e.name}: ${e.message}`));
    page.on('dialog', (d) => { page.dialogs.push(d.message()); d.dismiss(); });
    return page;
  };
  const typeCustomer = async (page) => {
    // Typed key by key, as a user would. (fill() pastes the whole value and hides how BUG-005 behaves.)
    await page.locator('[data-test=firstName]').pressSequentially('Davit');
    await page.locator('[data-test=lastName]').pressSequentially('Tester');
    await page.locator('[data-test=postalCode]').pressSequentially('0179');
  };

  // BUG-001: problem_user sees the same image for every product.
  let page = await freshPage();
  await login(page, 'problem_user');
  await page.waitForTimeout(800);
  log['BUG-001'] = { imageSources: await page.$$eval('.inventory_item img', (e) => e.map((x) => x.getAttribute('src'))) };
  await shot(page, 'BUG-001-same-product-images.png');

  // BUG-002: sorting has no effect (problem_user, error_user).
  log['BUG-002'] = {};
  for (const user of ['problem_user', 'error_user']) {
    page = await freshPage();
    await login(page, user);
    await page.selectOption('[data-test=product-sort-container]', 'za');
    const za = await page.$$eval('[data-test=inventory-item-name]', (e) => e.map((x) => x.textContent));
    await page.selectOption('[data-test=product-sort-container]', 'lohi');
    const lohi = await page.$$eval('[data-test=inventory-item-price]', (e) => e.map((x) => x.textContent));
    // No screenshot: the page looks exactly like before sorting (see BUG-001), so the log is the evidence.
    log['BUG-002'][user] = { firstAfterZtoA: za[0], pricesAfterLowToHigh: lohi, dialogs: page.dialogs };
  }

  // BUG-003 and BUG-004: problem_user cannot add 3 products and cannot remove from the list.
  page = await freshPage();
  await login(page, 'problem_user');
  for (const b of await page.$$('[data-test^="add-to-cart"]')) await b.click();
  log['BUG-003'] = {
    badgeAfterAddingAll: await badge(page),
    stillAddToCart: await page.$$eval('[data-test^="add-to-cart"]', (e) => e.map((x) => x.closest('.inventory_item').querySelector('[data-test=inventory-item-name]').textContent)),
  };
  await shot(page, 'BUG-003-add-to-cart-only-3-products.png');
  for (const b of await page.$$('[data-test^="remove"]')) await b.click();
  await page.waitForTimeout(300);
  // No screenshot: the page is unchanged from the BUG-003 screenshot, so the log is the evidence.
  log['BUG-004'] = { badgeAfterRemovingAll: await badge(page), buttonsStillRemove: (await page.$$('[data-test^="remove"]')).length };

  // BUG-005: typing a last name overwrites the first name field.
  page = await freshPage();
  await login(page, 'problem_user');
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.click('[data-test=shopping-cart-link]');
  await page.click('[data-test=checkout]');
  await typeCustomer(page);
  const typed = await page.$$eval('.form_input', (e) => e.map((x) => x.value));
  await page.click('[data-test=continue]');
  log['BUG-005'] = { fieldsAfterTyping: typed, error: await page.textContent('[data-test=error]'), url: page.url() };
  await page.waitForTimeout(300);
  await shot(page, 'BUG-005-last-name-overwrites-first-name.png');

  // BUG-006: the Backpack link opens another product.
  page = await freshPage();
  await login(page, 'problem_user');
  await page.click('[data-test=item-4-title-link]');
  await page.waitForSelector('[data-test=back-to-products]');
  log['BUG-006'] = { url: page.url(), opened: await page.textContent('.inventory_details_name') };
  await shot(page, 'BUG-006-wrong-product-page.png');

  // BUG-007: error_user, Add to cart / Remove throw errors.
  page = await freshPage();
  await login(page, 'error_user');
  for (const b of await page.$$('[data-test^="add-to-cart"]')) await b.click();
  const afterAdd = await badge(page);
  for (const b of await page.$$('[data-test^="remove"]')) await b.click();
  await page.waitForTimeout(300);
  log['BUG-007'] = { badgeAfterAddingAll: afterAdd, badgeAfterRemovingAll: await badge(page), uncaughtErrors: page.errors };
  await shot(page, 'BUG-007-add-and-remove-fail.png');

  // BUG-008 and BUG-009: error_user, empty Last Name accepted; Finish does nothing.
  page = await freshPage();
  await login(page, 'error_user');
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.click('[data-test=shopping-cart-link]');
  await page.click('[data-test=checkout]');
  await typeCustomer(page);
  const fields = await page.$$eval('.form_input', (e) => e.map((x) => x.value));
  const typingErrors = page.errors.length;
  await shot(page, 'BUG-008-last-name-stays-empty.png');
  await page.click('[data-test=continue]');
  await page.waitForSelector('[data-test=finish]');
  log['BUG-008'] = { fieldsAfterTyping: fields, uncaughtErrorsWhileTyping: page.errors.slice(0, typingErrors), urlAfterContinue: page.url() };
  page.errors.length = 0;
  await page.click('[data-test=finish]');
  await page.waitForTimeout(800);
  log['BUG-009'] = { urlAfterFinish: page.url(), uncaughtErrors: page.errors };
  await shot(page, 'BUG-009-finish-does-nothing.png');

  // BUG-010 and BUG-012: visual_user, wrong prices and layout defects.
  page = await freshPage();
  await login(page, 'visual_user');
  await page.waitForTimeout(800);
  const prices = () => page.$$eval('[data-test=inventory-item-price]', (e) => e.map((x) => x.textContent));
  const firstRender = await prices();
  await shot(page, 'BUG-010-wrong-prices.png');
  await page.reload();
  await page.waitForSelector('[data-test=inventory-item]');
  log['BUG-010'] = { pricesFirstRender: firstRender, pricesAfterReload: await prices() };
  log['BUG-011'] = {}; // keeps the log in bug order; filled below
  log['BUG-012'] = await page.evaluate(() => ({
    backpackImage: document.querySelector('.inventory_item img').getAttribute('src'),
    rightAlignedTitles: [...document.querySelectorAll('[data-test=inventory-item-name]')]
      .filter((e) => getComputedStyle(e).textAlign === 'right').map((e) => e.textContent),
    cartIconTop: Math.round(document.querySelector('[data-test=shopping-cart-link]').getBoundingClientRect().top),
    headerBottom: Math.round(document.querySelector('.primary_header').getBoundingClientRect().bottom),
  }));
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.click('[data-test=shopping-cart-link]');
  await page.click('[data-test=checkout]');
  await typeCustomer(page);
  await page.click('[data-test=continue]');
  await page.waitForURL(/step-two/);
  log['BUG-010'].backpackPriceAtCheckout = await page.textContent('[data-test=inventory-item-price]');

  // BUG-011: login time, 3 runs per account, each in a new browser context (empty cache and storage).
  log['BUG-011'] = { method: 'click Login -> first product card rendered; new browser context per run', ms: {} };
  for (const user of ['standard_user', 'performance_glitch_user']) {
    log['BUG-011'].ms[user] = [];
    for (let i = 0; i < 3; i++) {
      const p = await freshPage();
      log['BUG-011'].ms[user].push(await login(p, user));
      await p.context().close();
    }
  }

  const header = { capturedAt: new Date().toISOString(), browser: `Chromium ${browser.version()} (Playwright)`, viewport: '1280x800' };
  fs.writeFileSync(path.join(OUT, 'evidence-log.json'), JSON.stringify({ ...header, ...log }, null, 2) + '\n');
  await browser.close();
  console.log('Evidence saved to', OUT);
})();
