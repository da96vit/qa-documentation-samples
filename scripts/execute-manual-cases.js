// Executes the 17 test cases that are not in the Playwright regression suite and prints PASS/FAIL per case.
// Usage: node scripts/execute-manual-cases.js [account]   (default account: standard_user)
const { chromium } = require('@playwright/test');

const BASE = 'https://www.saucedemo.com';
const USER = process.argv[2] || 'standard_user';
const VIEWPORT = { width: 1280, height: 800 };
const PRICES = {
  'Sauce Labs Backpack': '$29.99',
  'Sauce Labs Bike Light': '$9.99',
  'Sauce Labs Bolt T-Shirt': '$15.99',
  'Sauce Labs Fleece Jacket': '$49.99',
  'Sauce Labs Onesie': '$7.99',
  'Test.allTheThings() T-Shirt (Red)': '$15.99',
};

async function login(page, user = USER) {
  await page.goto(BASE);
  await page.fill('[data-test=username]', user);
  await page.fill('[data-test=password]', 'secret_sauce');
  const t0 = Date.now();
  await page.click('[data-test=login-button]');
  await page.waitForSelector('[data-test=inventory-item]');
  return Date.now() - t0;
}

async function toCheckoutStepOne(p) {
  await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await p.click('[data-test=shopping-cart-link]');
  await p.click('[data-test=checkout]');
}

async function fillCustomer(p) {
  // Typed key by key, like a real user (fill() would paste the whole value at once).
  await p.locator('[data-test=firstName]').pressSequentially('Davit');
  await p.locator('[data-test=lastName]').pressSequentially('Tester');
  await p.locator('[data-test=postalCode]').pressSequentially('0179');
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const run = async (id, fn) => {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    page.on('dialog', (d) => d.dismiss());
    try {
      const note = await fn(page);
      results.push({ id, result: 'PASS', note: note || '' });
    } catch (e) {
      results.push({ id, result: 'FAIL', note: e.message.split('\n')[0] });
    }
    await context.close();
  };
  const check = (cond, msg) => { if (!cond) throw new Error(msg); };

  await run('TC-006', async (p) => {
    await p.goto(BASE);
    await p.fill('[data-test=username]', 'standard_user');
    await p.fill('[data-test=password]', 'wrong');
    await p.click('[data-test=login-button]');
    check((await p.$$('.input_error.error')).length === 2, 'red field markers not shown');
    await p.click('[data-test=error-button]');
    check(!(await p.$('[data-test=error]')), 'error still visible');
    check((await p.$$('.input_error.error')).length === 0, 'red field markers not cleared');
  });
  await run('TC-008', async (p) => {
    await login(p);
    await p.click('#react-burger-menu-btn');
    await p.click('[data-test=logout-sidebar-link]');
    await p.waitForSelector('[data-test=login-button]');
    await p.goBack();
    await p.waitForTimeout(500);
    check(!(await p.$('[data-test=inventory-item]')), 'products visible after Back');
  });
  await run('TC-009', async (p) => {
    await p.goto(BASE);
    check((await p.getAttribute('[data-test=password]', 'type')) === 'password', 'not masked');
  });
  await run('TC-011', async (p) => {
    await login(p);
    const srcs = await p.$$eval('.inventory_item img', (els) => els.map((e) => e.getAttribute('src')));
    check(new Set(srcs).size === 6 && !srcs.some((s) => s.includes('404')), `duplicate/placeholder images: ${srcs.join(', ')}`);
  });
  await run('TC-012', async (p) => {
    await login(p);
    const items = await p.$$eval('[data-test=inventory-item]', (els) =>
      els.map((e) => [e.querySelector('[data-test=inventory-item-name]').textContent, e.querySelector('[data-test=inventory-item-price]').textContent]));
    for (const [n, pr] of items) check(PRICES[n] === pr, `${n} shows ${pr}`);
  });
  await run('TC-016', async (p) => {
    await login(p);
    const listImg = await p.getAttribute('[data-test="inventory-item-sauce-labs-backpack-img"]', 'src');
    await p.click('[data-test=item-4-title-link]');
    // Wait for the detail page itself: right after the click the product list (whose first
    // name is also "Sauce Labs Backpack") can still be in the DOM.
    await p.waitForSelector('[data-test=back-to-products]');
    const name = await p.textContent('.inventory_details_name');
    check(name === 'Sauce Labs Backpack', `opened "${name}" (${p.url()})`);
    check((await p.textContent('.inventory_details_price')) === '$29.99', 'wrong price');
    check((await p.getAttribute('.inventory_details_img', 'src')) === listImg, 'different image');
  });
  await run('TC-017', async (p) => {
    await login(p);
    await p.selectOption('[data-test=product-sort-container]', 'hilo');
    await p.click('[data-test="add-to-cart-sauce-labs-onesie"]');
    await p.click('text=Sauce Labs Backpack');
    await p.click('[data-test=back-to-products]');
    await p.waitForSelector('[data-test=product-sort-container]');
    check(await p.$('[data-test=inventory-item]'), 'not on products page');
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart lost');
    const sort = await p.$eval('[data-test=product-sort-container]', (e) => e.value);
    return `sort after back = ${sort}`;
  });
  await run('TC-019', async (p) => {
    await login(p);
    for (const b of await p.$$('[data-test^="add-to-cart"]')) await b.click();
    const badge = (await p.$('[data-test=shopping-cart-badge]')) ? await p.textContent('[data-test=shopping-cart-badge]') : 'none';
    check(badge === '6', `badge = ${badge}`);
    check((await p.$$('[data-test^="remove"]')).length === 6, 'not every button changed to Remove');
  });
  await run('TC-021', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.click('[data-test=shopping-cart-link]');
    await p.click('[data-test="remove-sauce-labs-backpack"]');
    check((await p.$$('[data-test=inventory-item]')).length === 0, 'item still in cart');
    check(!(await p.$('[data-test=shopping-cart-badge]')), 'badge still shown');
  });
  await run('TC-023', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.reload();
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart lost after reload');
    await p.click('[data-test=shopping-cart-link]');
    check((await p.textContent('[data-test=inventory-item-name]')) === 'Sauce Labs Backpack', 'cart content changed');
  });
  await run('TC-024', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.click('[data-test=shopping-cart-link]');
    await p.click('[data-test=continue-shopping]');
    await p.waitForSelector('[data-test=product-sort-container]');
    check(p.url().includes('inventory'), 'not on products');
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart changed');
  });
  await run('TC-029', async (p) => {
    await login(p);
    await toCheckoutStepOne(p);
    await fillCustomer(p);
    const v = await p.$$eval('.form_input', (els) => els.map((e) => e.value).join('/'));
    check(v === 'Davit/Tester/0179', `fields = ${v}`);
  });
  await run('TC-031', async (p) => {
    await login(p);
    await toCheckoutStepOne(p);
    await fillCustomer(p);
    await p.click('[data-test=continue]');
    await p.waitForURL(/step-two/);
    await p.click('[data-test=cancel]');
    await p.waitForSelector('[data-test=product-sort-container]');
    check(p.url().includes('inventory'), `url = ${p.url()}`);
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart lost');
  });
  await run('TC-032', async (p) => {
    await login(p);
    await toCheckoutStepOne(p);
    await fillCustomer(p);
    await p.click('[data-test=continue]');
    await p.waitForURL(/step-two/);
    await p.click('[data-test=finish]');
    await p.click('[data-test=back-to-products]');
    await p.waitForSelector('[data-test=product-sort-container]');
    check(p.url().includes('inventory'), 'not on products');
    check(!(await p.$('[data-test=shopping-cart-badge]')), 'cart not empty');
  });
  await run('TC-033', async (p) => {
    await login(p); // warm-up, so DNS/TLS setup is not counted
    const p2 = await p.context().newPage();
    await p2.context().clearCookies();
    const ms = await login(p2);
    check(ms < 2000, `login took ${ms} ms`);
    return `${ms} ms`;
  });
  await run('TC-034', async (p) => {
    await login(p);
    await p.waitForTimeout(500);
    const problems = await p.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const inside = (a, b) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
      const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const out = [];
      const header = box(document.querySelector('.primary_header'));
      const cart = box(document.querySelector('[data-test=shopping-cart-link]'));
      const sort = box(document.querySelector('[data-test=product-sort-container]'));
      if (!inside(cart, header)) out.push('cart icon is outside the header');
      if (overlap(cart, sort)) out.push('cart icon overlaps the sort dropdown');
      const cards = [...document.querySelectorAll('[data-test=inventory-item]')];
      const rightGap = new Set();
      for (const c of cards) {
        const name = c.querySelector('[data-test=inventory-item-name]');
        if (getComputedStyle(name).textAlign === 'right') out.push(`title "${name.textContent}" is right-aligned`);
        rightGap.add(Math.round(box(c).right - box(c.querySelector('button')).right));
      }
      if (rightGap.size > 1) out.push(`"Add to cart" buttons are not aligned (right gaps: ${[...rightGap].join(', ')} px)`);
      return out;
    });
    check(problems.length === 0, problems.join('; '));
  });
  await run('TC-035', async (p) => {
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await login(p);
    await toCheckoutStepOne(p);
    await fillCustomer(p);
    await p.click('[data-test=continue]');
    await p.click('[data-test=finish]');
    await p.waitForTimeout(500);
    check(errs.length === 0, `uncaught errors: ${errs.join('; ')}`);
  });

  const passed = results.filter((r) => r.result === 'PASS').length;
  console.log(JSON.stringify({
    account: USER,
    browser: `Chromium ${browser.version()} (Playwright)`,
    viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
    executedAt: new Date().toISOString(),
    summary: `${passed}/${results.length} passed`,
    results,
  }, null, 1));
  await browser.close();
})();
