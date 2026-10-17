# Test Cases: Swag Labs Web Shop

| | |
|---|---|
| **Document ID** | TC-SL-001 |
| **Related plan** | TP-SL-001 |
| **Author** | Davit Jikurashvili |
| **Date** | 17 October 2026 |
| **Default precondition** | Browser open at https://www.saucedemo.com; password for every account is `secret_sauce` |

**Priority:** P1 = critical path / smoke, P2 = important, P3 = nice to have.
**Type:** F = functional, N = negative, UI = visual, NF = non-functional.
**Auto:** ✅ = automated in the [Playwright suite](https://github.com/da96vit/playwright-qa-portfolio) (each test title starts with the TC IDs it covers). Cases without ✅ are not in the regression suite; in this cycle they were executed with `scripts/execute-manual-cases.js`.

---

## 1. Authentication

| ID | Title | Pre-conditions | Steps | Expected result | Pri | Type | Auto |
|---|---|---|---|---|---|---|---|
| TC-001 | Login with valid credentials | On login page | 1. Enter `standard_user` 2. Enter `secret_sauce` 3. Click **Login** | Products page opens (`/inventory.html`) with 6 products | P1 | F | ✅ |
| TC-002 | Locked-out user cannot log in | On login page | 1. Enter `locked_out_user` / `secret_sauce` 2. Click **Login** | Error: "Epic sadface: Sorry, this user has been locked out." User stays on login page | P1 | N | ✅ |
| TC-003 | Wrong password is rejected | On login page | 1. Enter `standard_user` / `wrong` 2. Click **Login** | Error: "Username and password do not match any user in this service" | P1 | N | ✅ |
| TC-004 | Username is required | On login page | 1. Leave username empty 2. Enter password 3. Click **Login** | Error: "Username is required" | P2 | N | ✅ |
| TC-005 | Password is required | On login page | 1. Enter username 2. Leave password empty 3. Click **Login** | Error: "Password is required" | P2 | N | ✅ |
| TC-006 | Error message can be closed | TC-003 error is shown | 1. Click **X** on the error | Error disappears; red field markers are cleared | P3 | UI | |
| TC-007 | Protected page requires login | Not logged in | 1. Open `/inventory.html` directly | Redirect to login with error "You can only access '/inventory.html' when you are logged in." | P1 | N | ✅ |
| TC-008 | Logout ends the session | Logged in | 1. Open menu ☰ 2. Click **Logout** 3. Press browser **Back** | Login page shown; Back does not return to products | P2 | F | |
| TC-009 | Password field is masked | On login page | 1. Type a password | Characters shown as dots | P3 | UI | |

## 2. Product catalogue

| ID | Title | Pre-conditions | Steps | Expected result | Pri | Type | Auto |
|---|---|---|---|---|---|---|---|
| TC-010 | Product list shows all products | Logged in | 1. Look at the products page | 6 products, each with a unique image, name, description, price and **Add to cart** button | P1 | F | ✅ |
| TC-011 | Product images match product | Logged in | 1. Compare each image with its product name | Every image shows the correct product; no placeholder or duplicate images | P2 | UI | |
| TC-012 | Prices are correct and well formatted | Logged in | 1. Read each price | Prices: Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Red T-Shirt $15.99; always 2 decimals | P1 | F | |
| TC-013 | Sort by Name (Z to A) | Logged in | 1. Select **Name (Z to A)** | Products in reverse alphabetical order | P2 | F | ✅ |
| TC-014 | Sort by Price (low to high) | Logged in | 1. Select **Price (low to high)** | Prices in ascending order ($7.99 first) | P2 | F | ✅ |
| TC-015 | Sort by Price (high to low) | Logged in | 1. Select **Price (high to low)** | Prices in descending order ($49.99 first) | P2 | F | ✅ |
| TC-016 | Open product details | Logged in | 1. Click the name **Sauce Labs Backpack** | Detail page of *Sauce Labs Backpack* with the same name, price and image | P2 | F | |
| TC-017 | Back from product details | On a detail page | 1. Click **Back to products** | Products page shown; cart kept | P3 | F | |

## 3. Cart

| ID | Title | Pre-conditions | Steps | Expected result | Pri | Type | Auto |
|---|---|---|---|---|---|---|---|
| TC-018 | Add one product to cart | Logged in, cart empty | 1. Click **Add to cart** on Backpack | Button changes to **Remove**; cart badge shows 1 | P1 | F | ✅ |
| TC-019 | Add every product to cart | Logged in, cart empty | 1. Click **Add to cart** on all 6 products | All buttons change to **Remove**; badge shows 6 | P2 | F | |
| TC-020 | Remove product from products page | 2 items in cart | 1. Click **Remove** on one product | Button changes back to **Add to cart**; badge shows 1 | P1 | F | ✅ |
| TC-021 | Remove product from cart page | Item in cart | 1. Open cart 2. Click **Remove** | Item disappears from cart; badge updates or hides | P2 | F | |
| TC-022 | Cart page lists the selected items | 2 items added | 1. Click cart icon | Both items listed with quantity 1, name and price | P1 | F | ✅ |
| TC-023 | Cart survives page reload | Item in cart | 1. Reload page | Badge and cart contents unchanged | P3 | F | |
| TC-024 | Continue shopping from cart | On cart page | 1. Click **Continue Shopping** | Products page shown; cart unchanged | P3 | F | |

## 4. Checkout

| ID | Title | Pre-conditions | Steps | Expected result | Pri | Type | Auto |
|---|---|---|---|---|---|---|---|
| TC-025 | Complete purchase end to end | 2 items in cart | 1. Cart → **Checkout** 2. Enter Davit / Tester / 0179 → **Continue** 3. **Finish** | "Thank you for your order!" page; cart badge cleared | P1 | F | ✅ |
| TC-026 | First name is required | Checkout step 1 | 1. Leave all fields empty 2. **Continue** | Error: "First Name is required" | P2 | N | ✅ |
| TC-027 | Last name is required | First name filled | 1. Leave last name empty 2. **Continue** | Error: "Last Name is required" | P2 | N | ✅ |
| TC-028 | Postal code is required | First and last name filled | 1. Leave postal code empty 2. **Continue** | Error: "Postal Code is required" | P2 | N | ✅ |
| TC-029 | Form fields keep the typed values | Checkout step 1 | 1. Type (key by key) Davit, Tester, 0179 into first name, last name and postal code | Each field shows exactly what was typed in that field | P1 | F | |
| TC-030 | Order total is calculated correctly | Backpack + Bike Light in cart, on step 2 | 1. Read item total, tax and total | Item total $39.98; tax $3.20 (8%); total = item total + tax = $43.18 | P1 | F | ✅ |
| TC-031 | Cancel from order overview | On step 2 | 1. Click **Cancel** | Products page shown; cart kept | P3 | F | |
| TC-032 | Back Home after order | Order complete | 1. Click **Back Home** | Products page shown; cart is empty | P3 | F | |

## 5. Non-functional (light)

| ID | Title | Pre-conditions | Steps | Expected result | Pri | Type | Auto |
|---|---|---|---|---|---|---|---|
| TC-033 | Login response time | On login page, site already loaded once | 1. Log in and measure from clicking **Login** until the first product card is shown | Products page within 2 seconds | P2 | NF | |
| TC-034 | Products page layout is consistent | Logged in, window 1280×800 | 1. Check the position of the cart icon, product titles and **Add to cart** buttons | Cart icon inside the header, not overlapping the sort dropdown; all product titles left-aligned; every **Add to cart** button at the same position in its card | P3 | UI | |
| TC-035 | No JavaScript errors during purchase | DevTools console open | 1. Run TC-025 | No uncaught JavaScript errors in the console | P2 | NF | |

---

## Traceability matrix

| Requirement | Description | Test cases |
|---|---|---|
| REQ-01 | Registered users can log in; invalid or locked accounts are refused | TC-001 – TC-006, TC-009 |
| REQ-02 | Pages behind login are protected; logout ends the session | TC-007, TC-008 |
| REQ-03 | The catalogue shows correct product data | TC-010 – TC-012, TC-016, TC-017 |
| REQ-04 | Users can sort products by name and price | TC-013 – TC-015 |
| REQ-05 | Users can add and remove products and see the cart | TC-018 – TC-024 |
| REQ-06 | Checkout validates customer data | TC-026 – TC-029 |
| REQ-07 | Order totals are correct and the order can be completed | TC-025, TC-030 – TC-032 |
| REQ-08 | The app is responsive, visually consistent and error-free | TC-033 – TC-035 |

**Coverage:** 35 test cases across 8 requirements; every requirement has at least one test case. 18 of 35 (51%) are automated:

| Playwright test (tests/ui) | Test cases |
|---|---|
| login.spec.ts | TC-001, TC-002, TC-003, TC-004, TC-005, TC-007 |
| inventory.spec.ts | TC-010, TC-013, TC-014, TC-015, TC-018, TC-020 |
| checkout.spec.ts | TC-022, TC-025, TC-026, TC-027, TC-028, TC-030 |
