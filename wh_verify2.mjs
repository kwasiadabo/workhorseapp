import { chromium } from 'playwright-core';
import path from 'path';

const FRONTEND = 'http://localhost:5173';
const SHOT_DIR = '/tmp/wh_shots';

const EMP_EMAIL = process.argv[2];
const EMP_PASSWORD = process.argv[3];
const OWNER_EMAIL = process.argv[4];
const OWNER_PASSWORD = process.argv[5];
const BOOKING3_ID = process.argv[6]; // BK-20260612-0003, scheduledAt 15:48, status confirmed

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const shot = async (name) => {
  await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
  console.log('Screenshot:', name);
};

const login = async (email, password) => {
  await page.context().clearCookies();
  await page.goto(`${FRONTEND}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => url.pathname === '/app' || url.pathname === '/change-password', { timeout: 10000 });
  await page.waitForTimeout(400);

  if (page.url().includes('/change-password')) {
    console.log('mustChangePassword flow triggered, setting new password');
    const newPassword = 'NewPassword456!';
    await page.getByLabel('Current password', { exact: true }).fill(password);
    await page.getByLabel('New password', { exact: true }).fill(newPassword);
    await page.getByLabel('Confirm new password', { exact: true }).fill(newPassword);
    await page.getByRole('button', { name: 'Save new password' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/change-password'), { timeout: 10000 });
  }
};

try {
  // ================= PART A: employee queue Start -> Complete on BK-0002 =================
  console.log('=== Login as employee ===');
  await login(EMP_EMAIL, EMP_PASSWORD);

  await page.getByRole('link', { name: 'My Queue' }).click();
  await page.waitForURL(/\/app\/my-services/);
  await page.getByText(/BK-/).first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);

  const row2 = page.getByRole('row', { name: /BK-20260612-0002/ });
  console.log('Row2 (before):', (await row2.innerText()).replace(/\n/g, ' | '));

  console.log('=== Click Start on BK-0002 ===');
  await row2.getByRole('button', { name: /Start/ }).click();
  // wait for the row's badge to flip to "In progress" (network round-trip + refetch)
  await row2.getByText(/in progress/i).waitFor({ timeout: 20000 });
  console.log('Row2 (after Start):', (await row2.innerText()).replace(/\n/g, ' | '));
  await shot('A1-after-start.png');

  console.log('=== Click Complete on BK-0002 ===');
  await row2.getByRole('button', { name: /Complete/ }).click();
  // wait for the row to leave the queue table entirely
  await row2.waitFor({ state: 'detached', timeout: 20000 }).catch(async () => {
    console.log('Row2 still attached after Complete:', (await row2.innerText()).replace(/\n/g, ' | '));
  });
  await page.waitForTimeout(300);
  await shot('A2-after-complete.png');

  const queueText = await page.locator('table').first().innerText();
  console.log('Queue table after Complete:\n', queueText);
  const historyText = await page.locator('table').nth(1).innerText();
  console.log('History table after Complete:\n', historyText);

  // ================= PART B: owner changes Booking.status -> in_progress -> completed on BK-0003 =================
  console.log('=== Login as owner ===');
  await login(OWNER_EMAIL, OWNER_PASSWORD);

  await page.goto(`${FRONTEND}/app/bookings/${BOOKING3_ID}`);
  await page.waitForSelector('text=Overview');
  await shot('B0-booking3-before.png');

  const statusTrigger = page.locator('p:text("Status")').locator('xpath=following-sibling::*[1]');
  console.log('Status trigger text (before):', await statusTrigger.innerText());

  console.log('=== Set status to in_progress ===');
  await statusTrigger.click();
  await page.getByRole('option', { name: /in progress/i }).click();
  await page.getByText('Booking status updated').waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await shot('B1-in-progress.png');
  console.log('Status trigger text (after in_progress):', await statusTrigger.innerText());

  console.log('=== Set status to completed ===');
  await statusTrigger.click();
  await page.getByRole('option', { name: /^completed$/i }).click();
  await page.getByText('Booking status updated').waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await shot('B2-completed.png');

  const deliveryCard = page.locator('text=Service delivery').locator('xpath=ancestor::*[contains(@class,"rounded-xl") or contains(@data-slot,"card")][1]');
  const deliveryText = await page.locator('text=Service delivery').locator('xpath=../..').innerText().catch(() => 'N/A');
  console.log('Service delivery card:\n', deliveryText);
} catch (err) {
  console.error('ERROR:', err);
  await shot('ERROR2.png').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
