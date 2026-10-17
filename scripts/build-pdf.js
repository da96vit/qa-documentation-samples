// Renders every docs/*.md file to a styled PDF in pdf/.
// Usage: node scripts/build-pdf.js
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { marked } = require('marked');
const { chromium } = require('@playwright/test');

const DOCS = path.join(__dirname, '..', 'docs');
const OUT = path.join(__dirname, '..', 'pdf');

const css = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1f2933; }
  h1 { font-size: 22pt; color: #0b5394; border-bottom: 3px solid #0b5394; padding-bottom: 6px; margin: 0 0 14px; }
  h2 { font-size: 14pt; color: #0b5394; margin: 22px 0 8px; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 16px 0 6px; page-break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 9pt; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { background: #0b5394; color: #fff; text-align: left; padding: 5px 6px; }
  /* Key/value tables use an empty header row in markdown; hide it. */
  thead:has(th:empty) { display: none; }
  thead:has(th:empty) + tbody td:first-child { font-weight: 600; width: 32%; background: #f5f8fb; }
  td { border: 1px solid #d0d7de; padding: 4px 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #f5f8fb; }
  code { background: #eef2f6; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
  hr { border: none; border-top: 1px solid #d0d7de; margin: 18px 0; }
  img { max-width: 100%; border: 1px solid #d0d7de; margin: 6px 0 4px; page-break-inside: avoid; }
  a { color: #0b5394; }
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const files = fs.readdirSync(DOCS).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
      <body>${marked.parse(fs.readFileSync(path.join(DOCS, file), 'utf8'))}</body></html>`;
    // Written next to the markdown so relative image paths (evidence/...) resolve.
    const tmp = path.join(DOCS, `_${file}.html`);
    fs.writeFileSync(tmp, html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    const pdfName = file.replace(/\.md$/, '.pdf');
    await page.pdf({
      path: path.join(OUT, pdfName),
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size:8px;width:100%;padding:0 16mm;color:#6b7785;display:flex;justify-content:space-between">
        <span>Swag Labs QA Documentation · Davit Jikurashvili</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
    });
    fs.unlinkSync(tmp);
    console.log('pdf/' + pdfName);
  }
  await browser.close();
})();
