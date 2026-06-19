import { chromium } from 'playwright-core';

const FRONTEND = 'http://localhost:5173';
const ownerEmail = 'queue-owner-1781282211756@example.com';
const ownerPassword = 'Password123!';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const shot = (name) => page.screenshot({ path: `/tmp/wh_shots/q-${name}.png`, fullPage: true });

try {
  await page.goto(`${FRONTEND}/login`);
  await page.fill('input[name="email"]', ownerEmail);
  await page.fill('input[name="password"]', ownerPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${FRONTEND}/app`);
  console.log('Logged in as tenant owner');

  // Nav item present?
  const queuesLink = page.getByRole('link', { name: 'Queues', exact: true });
  console.log('Queues nav link visible:', await queuesLink.isVisible());

  await queuesLink.click();
  await page.waitForURL(`${FRONTEND}/app/queues`);
  await page.waitForTimeout(800);
  await shot('01-initial');
  console.log('Navigated to /app/queues');

  // Capture table text for both sections
  const bodyText = await page.locator('main').innerText();
  console.log('--- PAGE TEXT (first 2000 chars) ---');
  console.log(bodyText.slice(0, 2000));

  // Filter by service provider: Sam Provider
  await page.click('text=All service providers');
  await page.waitForTimeout(300);
  await shot('02-provider-dropdown-open');
  await page.click('div[role="option"]:has-text("Sam Provider")');
  await page.waitForTimeout(800);
  await shot('03-filtered-sam');
  const filteredText = await page.locator('main').innerText();
  console.log('--- AFTER FILTER: Sam Provider ---');
  console.log(filteredText.slice(0, 2000));

  // Reset to All
  await page.click('text=Sam Provider');
  await page.waitForTimeout(200);
  await page.click('div[role="option"]:has-text("All service providers")');
  await page.waitForTimeout(800);

  // Date range filter - only "today"
  const today = new Date().toISOString().slice(0, 10);
  await page.fill('#scheduled-from', today);
  await page.fill('#scheduled-to', today);
  await page.waitForTimeout(800);
  await shot('04-date-range-today');
  const dateFilteredText = await page.locator('main').innerText();
  console.log('--- AFTER DATE RANGE: today only ---');
  console.log(dateFilteredText.slice(0, 2000));

  console.log('DONE');
} catch (err) {
  console.error('ERROR:', err.message);
  await shot('ERROR');
} finally {
  await browser.close();
}
