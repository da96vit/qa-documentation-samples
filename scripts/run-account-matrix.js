// Runs the key test cases against every demo account and prints the "Results by account"
// table used in docs/04-Test-Summary-Report.md (section 3).
// Usage: node scripts/run-account-matrix.js
const { chromium } = require('@playwright/test');

const BASE = 'https://www.saucedemo.com';
const ACCOUNTS = ['standard_user', 'problem_user', 'error_user', 'visual_user', 'performance_glitch_user'];
const PRICES = {
  'Sauce Labs Backpack': '$29.99',
  'Sauce Labs Bike Light': '$9.99',
  'Sauce Labs Bolt T-Shirt': '$15.99',
  'Sauce Labs Fleece Jacket': '$49.99',
  'Sauce Labs Onesie': '$7.99',
  'Test.allTheThings() T-Shirt (Red)': '$15.99',
};

const check = (cond, msg) => { if (!cond) throw new Error(msg); };
const badge = async (p) => ((await p.$('[data-test=shopping-cart-badge]')) ? p.textContent('[data-test=shopping-cart-badge]') : '0');

async function login(p, user) {
  await p.goto(BASE);
  await p.fill('[data-test=username]', user);
  await p.fill('[data-test=password]', 'secret_sauce');
  const t0 = Date.now();
  await p.click('[data-test=login-button]');
  await p.waitForSelector('[data-test=inventory-item]', { timeout: 15000 });
  return Date.now() - t0;
}

async function checkoutStepOne(p) {
  await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await p.click('[data-test=shopping-cart-link]');
  await p.click('[data-test=checkout]');
  await p.locator('[data-test=firstName]').pressSequentially('Davit');
  await p.locator('[data-test=lastName]').pressSequentially('Tester');
  await p.locator('[data-test=postalCode]').pressSequentially('0179');
}

const CASES = {
  'TC-001 Login': async (p, u) => { await login(p, u); check(p.url().includes('inventory'), 'not logged in'); },
  'TC-011 Correct product images': async (p, u) => {
    await login(p, u);
    const srcs = await p.$$eval('.inventory_item img', (e) => e.map((x) => x.getAttribute('src')));
    check(new Set(srcs).size === 6 && !srcs.some((s) => s.includes('sl-404')), 'placeholder or duplicate image');
  },
  'TC-012 Correct prices': async (p, u) => {
    await login(p, u);
    const rows = await p.$$eval('[data-test=inventory-item]', (els) => els.map((e) => [
      e.querySelector('[data-test=inventory-item-name]').textContent, e.querySelector('[data-test=inventory-item-price]').textContent]));
    for (const [n, pr] of rows) check(PRICES[n] === pr, `${n} = ${pr}`);
  },
  'TC-013/014 Sorting': async (p, u) => {
    await login(p, u);
    await p.selectOption('[data-test=product-sort-container]', 'za');
    const names = await p.$$eval('[data-test=inventory-item-name]', (e) => e.map((x) => x.textContent));
    check(JSON.stringify(names) === JSON.stringify([...names].sort().reverse()), 'Z-A not applied');
    await p.selectOption('[data-test=product-sort-container]', 'lohi');
    const prices = await p.$$eval('[data-test=inventory-item-price]', (e) => e.map((x) => Number(x.textContent.slice(1))));
    check(JSON.stringify(prices) === JSON.stringify([...prices].sort((a, b) => a - b)), 'low-high not applied');
  },
  'TC-016 Product details': async (p, u) => {
    await login(p, u);
    await p.click('[data-test=item-4-title-link]');
    await p.waitForSelector('[data-test=back-to-products]');
    const name = await p.textContent('.inventory_details_name');
    check(name === 'Sauce Labs Backpack', `opened ${name}`);
  },
  'TC-019 Add all products': async (p, u) => {
    await login(p, u);
    for (const b of await p.$$('[data-test^="add-to-cart"]')) await b.click();
    const n = await badge(p);
    check(n === '6', `badge = ${n}`);
  },
  'TC-020 Remove from list': async (p, u) => {
    await login(p, u);
    await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await p.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    await p.click('[data-test="remove-sauce-labs-backpack"]');
    await p.waitForTimeout(300);
    const n = await badge(p);
    check(n === '1', `badge = ${n}`);
  },
  'TC-029 Checkout form input': async (p, u) => {
    await login(p, u);
    await checkoutStepOne(p);
    const v = await p.$$eval('.form_input', (e) => e.map((x) => x.value).join('/'));
    check(v === 'Davit/Tester/0179', `fields = ${v}`);
  },
  'TC-025 Complete purchase': async (p, u) => {
    await login(p, u);
    await checkoutStepOne(p);
    await p.click('[data-test=continue]');
    await p.waitForURL(/step-two/, { timeout: 5000 }).catch(() => { throw new Error('blocked at step one'); });
    await p.click('[data-test=finish]');
    await p.waitForURL(/checkout-complete/, { timeout: 5000 }).catch(() => { throw new Error('Finish did not complete the order'); });
  },
  'TC-033 Login < 2 s': async (p, u) => {
    await login(p, u); // warm-up
    const p2 = await p.context().newPage();
    await p2.context().clearCookies();
    const ms = await login(p2, u);
    check(ms < 2000, `${(ms / 1000).toFixed(1)} s`);
    return `${(ms / 1000).toFixed(1)} s`;
  },
  'TC-034 Layout': async (p, u) => {
    await login(p, u);
    await p.waitForTimeout(500);
    const problems = await p.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const out = [];
      const h = box(document.querySelector('.primary_header'));
      const c = box(document.querySelector('[data-test=shopping-cart-link]'));
      if (c.top < h.top || c.bottom > h.bottom || c.left < h.left || c.right > h.right) out.push('cart icon outside header');
      const gaps = new Set();
      for (const card of document.querySelectorAll('[data-test=inventory-item]')) {
        if (getComputedStyle(card.querySelector('[data-test=inventory-item-name]')).textAlign === 'right') out.push('right-aligned title');
        gaps.add(Math.round(box(card).right - box(card.querySelector('button')).right));
      }
      if (gaps.size > 1) out.push('misaligned button');
      return out;
    });
    check(problems.length === 0, [...new Set(problems)].join(', '));
  },
};

(async () => {
  const browser = await chromium.launch();
  const table = {};
  for (const [name, fn] of Object.entries(CASES)) {
    table[name] = {};
    for (const user of ACCOUNTS) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.on('dialog', (d) => d.dismiss());
      try {
        const note = await fn(page, user);
        table[name][user] = 'PASS' + (note ? ` (${note})` : '');
      } catch (e) {
        table[name][user] = 'FAIL: ' + e.message.split('\n')[0];
      }
      await context.close();
    }
  }
  console.log(`Chromium ${browser.version()} (Playwright), ${new Date().toISOString()}\n`);
  console.log(`| Test case | ${ACCOUNTS.join(' | ')} |`);
  console.log(`|---|${ACCOUNTS.map(() => '---').join('|')}|`);
  for (const [name, row] of Object.entries(table)) console.log(`| ${name} | ${ACCOUNTS.map((u) => row[u]).join(' | ')} |`);
  await browser.close();
})();
