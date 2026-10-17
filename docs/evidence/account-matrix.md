Chromium 156.0.8078.4 (Playwright), 2026-10-17T10:12:22.383Z

| Test case | standard_user | problem_user | error_user | visual_user | performance_glitch_user |
|---|---|---|---|---|---|
| TC-001 Login | PASS | PASS | PASS | PASS | PASS |
| TC-011 Correct product images | PASS | FAIL: placeholder or duplicate image | PASS | FAIL: placeholder or duplicate image | PASS |
| TC-012 Correct prices | PASS | PASS | PASS | FAIL: Sauce Labs Backpack = $74.28 | PASS |
| TC-013/014 Sorting | PASS | FAIL: Z-A not applied | FAIL: Z-A not applied | FAIL: low-high not applied | PASS |
| TC-016 Product details | PASS | FAIL: opened Sauce Labs Fleece Jacket | PASS | PASS | PASS |
| TC-019 Add all products | PASS | FAIL: badge = 3 | FAIL: badge = 3 | PASS | PASS |
| TC-020 Remove from list | PASS | FAIL: badge = 2 | FAIL: badge = 2 | PASS | PASS |
| TC-029 Checkout form input | PASS | FAIL: fields = r//0179 | FAIL: fields = Davit//0179 | PASS | PASS |
| TC-025 Complete purchase | PASS | FAIL: blocked at step one | FAIL: Finish did not complete the order | PASS | PASS |
| TC-033 Login < 2 s | PASS (0.1 s) | PASS (0.1 s) | PASS (0.1 s) | PASS (0.1 s) | FAIL: 5.1 s |
| TC-034 Layout | PASS | PASS | PASS | FAIL: cart icon outside header, right-aligned title, misaligned button | PASS |
