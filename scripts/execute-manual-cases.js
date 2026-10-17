// Executes the test cases that are not in the Playwright suite against standard_user
// and prints PASS/FAIL per case. Usage: node scripts/execute-manual-cases.js
const { chromium } = require('@playwright/test');

const BASE = 'https://www.saucedemo.com';
const PRICES = {
  'Sauce Labs Backpack': '$29.99',
  'Sauce Labs Bike Light': '$9.99',
  'Sauce Labs Bolt T-Shirt': '$15.99',
  'Sauce Labs Fleece Jacket': '$49.99',
  'Sauce Labs Onesie': '$7.99',
  'Test.allTheThings() T-Shirt (Red)': '$15.99',
};

async function login(page, user = 'standard_user') {
  await page.goto(BASE);
  await page.fill('[data-test=username]', user);
  await page.fill('[data-test=password]', 'secret_sauce');
  const t0 = Date.now();
  await page.click('[data-test=login-button]');
  await page.waitForSelector('[data-test=inventory-item]');
  return Date.now() - t0;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const run = async (id, fn) => {
    const page = await (await browser.newContext()).newPage();
    try {
      const note = await fn(page);
      results.push({ id, result: 'PASS', note: note || '' });
    } catch (e) {
      results.push({ id, result: 'FAIL', note: e.message.split('\n')[0] });
    }
  };
  const check = (cond, msg) => { if (!cond) throw new Error(msg); };

  await run('TC-006', async (p) => {
    await p.goto(BASE);
    await p.fill('[data-test=username]', 'standard_user');
    await p.fill('[data-test=password]', 'wrong');
    await p.click('[data-test=login-button]');
    await p.click('[data-test=error-button]');
    check(!(await p.$('[data-test=error]')), 'error still visible');
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
    check(new Set(srcs).size === 6 && !srcs.some((s) => s.includes('404')), 'duplicate/placeholder images');
  });
  await run('TC-012', async (p) => {
    await login(p);
    const items = await p.$$eval('[data-test=inventory-item]', (els) =>
      els.map((e) => [e.querySelector('[data-test=inventory-item-name]').textContent, e.querySelector('[data-test=inventory-item-price]').textContent]));
    for (const [n, pr] of items) check(PRICES[n] === pr, `${n} shows ${pr}`);
  });
  await run('TC-016', async (p) => {
    await login(p);
    await p.click('text=Sauce Labs Backpack');
    check((await p.textContent('[data-test=inventory-item-name]')) === 'Sauce Labs Backpack', 'wrong product');
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
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '6', 'badge not 6');
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
  });
  await run('TC-024', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.click('[data-test=shopping-cart-link]');
    await p.click('[data-test=continue-shopping]');
    check(p.url().includes('inventory'), 'not on products');
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart changed');
  });
  await run('TC-029', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.goto(`${BASE}/checkout-step-one.html`);
    await p.fill('[data-test=firstName]', 'Davit');
    await p.fill('[data-test=lastName]', 'Tester');
    await p.fill('[data-test=postalCode]', '0179');
    const v = await p.$$eval('.form_input', (els) => els.map((e) => e.value).join('/'));
    check(v === 'Davit/Tester/0179', `fields = ${v}`);
  });
  await run('TC-031', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.goto(`${BASE}/checkout-step-one.html`);
    await p.fill('[data-test=firstName]', 'Davit');
    await p.fill('[data-test=lastName]', 'Tester');
    await p.fill('[data-test=postalCode]', '0179');
    await p.click('[data-test=continue]');
    await p.click('[data-test=cancel]');
    check(p.url().includes('inventory'), `url = ${p.url()}`);
    check((await p.textContent('[data-test=shopping-cart-badge]')) === '1', 'cart lost');
  });
  await run('TC-032', async (p) => {
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.goto(`${BASE}/checkout-step-one.html`);
    await p.fill('[data-test=firstName]', 'Davit');
    await p.fill('[data-test=lastName]', 'Tester');
    await p.fill('[data-test=postalCode]', '0179');
    await p.click('[data-test=continue]');
    await p.click('[data-test=finish]');
    await p.click('[data-test=back-to-products]');
    check(p.url().includes('inventory'), 'not on products');
    check(!(await p.$('[data-test=shopping-cart-badge]')), 'cart not empty');
  });
  await run('TC-033', async (p) => {
    await login(p); // warm-up
    const p2 = await p.context().newPage();
    await p2.context().clearCookies();
    const ms = await login(p2);
    check(ms < 2000, `login took ${ms} ms`);
    return `${ms} ms`;
  });
  await run('TC-035', async (p) => {
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await login(p);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.goto(`${BASE}/checkout-step-one.html`);
    await p.fill('[data-test=firstName]', 'Davit');
    await p.fill('[data-test=lastName]', 'Tester');
    await p.fill('[data-test=postalCode]', '0179');
    await p.click('[data-test=continue]');
    await p.click('[data-test=finish]');
    check(errs.length === 0, `uncaught errors: ${errs.join('; ')}`);
  });

  // Performance comparison for BUG-011 (3 runs each, warm cache).
  const perf = {};
  for (const user of ['standard_user', 'performance_glitch_user']) {
    perf[user] = [];
    for (let i = 0; i < 3; i++) {
      const p = await (await browser.newContext()).newPage();
      perf[user].push(await login(p, user));
    }
  }

  console.log(JSON.stringify({ results, perf }, null, 1));
  await browser.close();
})();
