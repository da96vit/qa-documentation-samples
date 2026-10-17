# QA Documentation Samples: Swag Labs Web Shop

A complete set of QA documents for one test cycle of the public demo shop [saucedemo.com](https://www.saucedemo.com), written the way I deliver them to clients and teams.

| # | Document | What it shows | Markdown | PDF |
|---|---|---|---|---|
| 1 | **Test Plan** | Scope, approach, entry/exit criteria, environment, risks, schedule | [View](docs/01-Test-Plan.md) | [PDF](pdf/01-Test-Plan.pdf) |
| 2 | **Test Cases + Traceability Matrix** | 35 test cases (steps, expected results, priority, type, automation status) mapped to 8 requirements | [View](docs/02-Test-Cases.md) | [PDF](pdf/02-Test-Cases.pdf) |
| 3 | **Bug Reports** | 12 reproducible defects with severity, priority, steps, expected vs actual, impact and screenshot evidence | [View](docs/03-Bug-Reports.md) | [PDF](pdf/03-Bug-Reports.pdf) |
| 4 | **Test Summary Report** | Execution results, results by account, defect statistics, recommendations and Go/No-Go decision | [View](docs/04-Test-Summary-Report.md) | [PDF](pdf/04-Test-Summary-Report.pdf) |

## Highlights

- **Real findings, not invented ones.** Every bug was reproduced in the live app. Saucedemo ships test accounts (`problem_user`, `error_user`, `visual_user`, `performance_glitch_user`) that each simulate a different class of defect, and all results are compared against the baseline account `standard_user`.
- **Evidence-based:** screenshots in [`docs/evidence/`](docs/evidence) are captured by a script ([`scripts/capture-evidence.js`](scripts/capture-evidence.js)), so they can be regenerated at any time.
- **Measured, not guessed:** for example, BUG-011's login time is measured over 3 runs per account (≈5.1 s vs ≈0.1 s).
- **Linked to automation:** 18 of the 35 test cases are automated in the companion repo [playwright-qa-portfolio](https://github.com/da96vit/playwright-qa-portfolio). The API layer is covered in [postman-api-tests](https://github.com/da96vit/postman-api-tests).

## Rebuild the PDFs

```bash
npm install
npx playwright install chromium
node scripts/capture-evidence.js   # refresh screenshots
node scripts/build-pdf.js          # docs/*.md -> pdf/*.pdf
```

## About me

**Davit Jikurashvili**, Senior QA Automation Engineer · 6+ years in fintech, banking, healthcare and ad tech.
[Upwork](https://www.upwork.com/freelancers/~01027aece733fa0c7b) · [LinkedIn](https://www.linkedin.com/in/davit-jikurashvili-801a2319a/)
