# QA Documentation Samples: Swag Labs Web Shop

A complete set of QA documents for one test cycle of the public demo shop [saucedemo.com](https://www.saucedemo.com), written the way I deliver them to clients and teams.

| # | Document | What it shows | Markdown | PDF |
|---|---|---|---|---|
| 1 | **Test Plan** | Scope, approach, entry/exit/suspension/resumption criteria, environment, risks, schedule, approvals | [View](docs/01-Test-Plan.md) | [PDF](pdf/01-Test-Plan.pdf) |
| 2 | **Test Cases + Traceability Matrix** | 35 test cases (steps, expected results, priority, type, automation status) mapped to 8 requirements | [View](docs/02-Test-Cases.md) | [PDF](pdf/02-Test-Cases.pdf) |
| 3 | **Bug Reports** | 12 reproducible defects (3 Critical, 4 High, 4 Medium, 1 Low) with steps, expected vs actual, impact and evidence | [View](docs/03-Bug-Reports.md) | [PDF](pdf/03-Bug-Reports.pdf) |
| 4 | **Test Summary Report** | Execution results, results by account, defect statistics, deviations, recommendations and Go/No-Go decision | [View](docs/04-Test-Summary-Report.md) | [PDF](pdf/04-Test-Summary-Report.pdf) |

## Highlights

- **Real findings, not invented ones.** Every bug was reproduced in the live app. Saucedemo ships test accounts (`problem_user`, `error_user`, `visual_user`, `performance_glitch_user`) that each simulate a different class of defect, and all results are compared against the baseline account `standard_user`.
- **Every result can be re-run.** The scripts below execute the test cases and reproduce the defects; their output is saved in [`docs/evidence/`](docs/evidence) next to the screenshots.
- **Measured, not guessed:** for example, BUG-011's login time is measured over 3 runs per account (≈5.1 s vs ≈0.1 s), and the raw values are in [`evidence-log.json`](docs/evidence/evidence-log.json).
- **Linked to automation:** 18 of the 35 test cases are automated in the companion repo [playwright-qa-portfolio](https://github.com/da96vit/playwright-qa-portfolio); each Playwright test is named after the test case IDs it covers. The API layer is covered in [postman-api-tests](https://github.com/da96vit/postman-api-tests).

## Scripts

| Script | What it does | Output |
|---|---|---|
| [`scripts/execute-manual-cases.js`](scripts/execute-manual-cases.js) | Executes the 17 cases that are not in the Playwright suite (default account `standard_user`, or pass another account) | [`manual-cases-standard_user.json`](docs/evidence/manual-cases-standard_user.json) |
| [`scripts/run-account-matrix.js`](scripts/run-account-matrix.js) | Runs 11 key cases against all 5 demo accounts (Test Summary Report, section 3) | [`account-matrix.md`](docs/evidence/account-matrix.md) |
| [`scripts/capture-evidence.js`](scripts/capture-evidence.js) | Reproduces all 12 defects, takes the screenshots and records URLs, field values, console errors and timings | `docs/evidence/*.png`, [`evidence-log.json`](docs/evidence/evidence-log.json) |
| [`scripts/build-pdf.js`](scripts/build-pdf.js) | Renders `docs/*.md` to `pdf/*.pdf` | `pdf/` |

```bash
npm install
npx playwright install chromium
node scripts/execute-manual-cases.js > docs/evidence/manual-cases-standard_user.json
node scripts/run-account-matrix.js   > docs/evidence/account-matrix.md
node scripts/capture-evidence.js     # screenshots + evidence-log.json
node scripts/build-pdf.js            # docs/*.md -> pdf/*.pdf
```

## About me

**Davit Jikurashvili**, Senior QA Engineer · 6+ years in fintech, banking, healthcare/pharma, ad tech and TV & entertainment.
[Upwork](https://www.upwork.com/freelancers/~01027aece733fa0c7b) · [LinkedIn](https://www.linkedin.com/in/davit-jikurashvili-801a2319a/)
