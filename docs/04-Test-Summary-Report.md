# Test Summary Report: Swag Labs Web Shop

| | |
|---|---|
| **Document ID** | TSR-SL-001 |
| **Related plan** | TP-SL-001 |
| **Author** | Davit Jikurashvili |
| **Test cycle** | 17 October 2026 |
| **Build / environment** | Production demo, https://www.saucedemo.com (no build number exposed) · Chromium 156 and Firefox 157 (Playwright 1.64) · Windows 11 |

---

## 1. Summary

The core purchase journey **works correctly for the baseline account (`standard_user`)**: all 35 test cases pass in Chromium, and the 18 automated cases also pass in Firefox.

When the same cases are run against the other demo accounts, **12 defects** appear, **3 of them Critical**. They block checkout (BUG-005, BUG-009) or show prices that differ from the amount charged (BUG-010).

**Recommendation:** release is acceptable for the baseline configuration only. The Critical and High defects tied to the other accounts must be fixed and retested before those configurations go live.

## 2. Execution results: `standard_user` (baseline)

| Metric | Value |
|---|---|
| Test cases planned | 35 |
| Executed | 35 (100%) |
| Passed | 35 |
| Failed | 0 |
| Blocked | 0 |
| How executed | 18 cases by the Playwright suite (14 UI tests, Chromium + Firefox); 17 cases by `scripts/execute-manual-cases.js` (Chromium), see [evidence/manual-cases-standard_user.json](https://github.com/da96vit/qa-documentation-samples/blob/main/docs/evidence/manual-cases-standard_user.json) |
| Automated runs (Playwright, CI) | 38 / 38 tests passed (14 UI × Chromium, 14 UI × Firefox, 10 API) |

## 3. Results by account (key test cases)

Produced by `scripts/run-account-matrix.js` (Chromium); raw output in [evidence/account-matrix.md](https://github.com/da96vit/qa-documentation-samples/blob/main/docs/evidence/account-matrix.md).

| Test case | standard | problem | error | visual | perf. glitch |
|---|---|---|---|---|---|
| TC-001 Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| TC-011 Correct product images | ✅ | ❌ BUG-001 | ✅ | ❌ BUG-012 | ✅ |
| TC-012 Correct prices | ✅ | ✅ | ✅ | ❌ BUG-010 | ✅ |
| TC-013/014 Sorting | ✅ | ❌ BUG-002 | ❌ BUG-002 | ❌ BUG-010 | ✅ |
| TC-016 Product details | ✅ | ❌ BUG-006 | ✅ | ✅ | ✅ |
| TC-019 Add all products | ✅ | ❌ BUG-003 | ❌ BUG-007 | ✅ | ✅ |
| TC-020 Remove from list | ✅ | ❌ BUG-004 | ❌ BUG-007 | ✅ | ✅ |
| TC-029 Checkout form input | ✅ | ❌ BUG-005 | ❌ BUG-008 | ✅ | ✅ |
| TC-025 Complete purchase | ✅ | ❌ blocked by BUG-005 | ❌ BUG-009 | ✅ | ✅ |
| TC-033 Login < 2 s | ✅ 0.1 s | ✅ | ✅ | ✅ | ❌ BUG-011 (5.1 s) |
| TC-034 Layout | ✅ | ✅ | ✅ | ❌ BUG-012 | ✅ |

## 4. Defects

| Severity | Count | IDs |
|---|---|---|
| Critical | 3 | BUG-005, BUG-009, BUG-010 |
| High | 4 | BUG-003, BUG-006, BUG-007, BUG-008 |
| Medium | 4 | BUG-001, BUG-002, BUG-004, BUG-011 |
| Low | 1 | BUG-012 |
| **Total** | **12** | All open |

**Defects by area:** Checkout 3 · Cart 3 · Catalogue 5 · Performance 1

Full details, steps and evidence are in *03-Bug-Reports*.

## 5. Observations and improvement suggestions

1. **Sort order is not kept.** After opening a product and going back, the list returns to Name (A to Z). This isn't a requirement, but keeping the user's choice would be friendlier.
2. **Console noise.** Even for `standard_user`, the Products page logs two failed requests (401 Unauthorized) to the third-party error tracker `events.backtrace.io`. They don't affect the user, but they make real errors harder to spot and should be cleaned up.
3. **Validation gap.** BUG-008 shows that the checkout form can be submitted with a required field empty. Server-side validation of customer data is recommended.
4. **Accessibility (not in scope).** A future cycle should check keyboard-only navigation and screen-reader labels on the sort dropdown and the cart icon.

## 6. Deviations from the plan

| Planned | Actual |
|---|---|
| Exploratory sessions with charters | No separate session sheets were recorded in this cycle; defects were found by running the scripted cases against every account |
| Example 1-week schedule | All documents and the recorded execution are dated 17 October 2026; the schedule in the plan is an example for a client project |

## 7. Exit criteria check

| Criterion | Status |
|---|---|
| 100% of planned test cases executed | ✅ Met |
| 100% of smoke / P1 cases pass for `standard_user` | ✅ Met |
| No open Critical/High defects on the baseline account | ✅ Met; all 12 defects are account-specific |
| All defects logged with evidence | ✅ Met: 8 screenshots plus [evidence-log.json](https://github.com/da96vit/qa-documentation-samples/blob/main/docs/evidence/evidence-log.json) for all 12 defects |

## 8. Sign-off

| Role | Name | Decision |
|---|---|---|
| QA Engineer | Davit Jikurashvili | Baseline: **Go** · Other account configurations: **No-Go** until their Critical and High defects are fixed and retested (the plan's exit criterion) |
