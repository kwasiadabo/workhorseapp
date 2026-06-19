import { chromium } from 'playwright-core';
import path from 'path';

const FRONTEND = 'http://localhost:5173';
const SHOT_DIR = '/tmp/wh_shots';

const OWNER_EMAIL = process.argv[2];
const OWNER_PASSWORD = process.argv[3];
const EMP_EMAIL = process.argv[4];
const EMP_PASSWORD = process.argv[5];

await import('fs/promises').then((fs) => fs.mkdir(SHOT_DIR, { recursive: true }));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const shot = async (name) => {
  await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
  console.log('Screenshot:', name);
};

const login = async (email, password) => {
  await page.goto(`${FRONTEND}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => url.pathname === '/app' || url.pathname === '/change-password', { timeout: 10000 });
  await page.waitForTimeout(400); // let a post-login redirect to /change-password settle

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

const logout = async () => {
  // open user menu and click logout
  await page.getByRole('button', { name: /account|menu|user/i }).first().click().catch(() => {});
};

try {
  // ---- 1. Login as owner ----
  console.log('=== Login as owner ===');
  await login(OWNER_EMAIL, OWNER_PASSWORD);
  await shot('01-owner-dashboard.png');

  // ---- 2. Go to new booking page ----
  console.log('=== New booking page ===');
  await page.goto(`${FRONTEND}/app/bookings/new`);
  await page.waitForSelector('text=New booking');

  const scheduledInput = page.locator('input[type="datetime-local"]');
  const scheduledValue = await scheduledInput.inputValue();
  console.log('scheduledAt default value:', scheduledValue);

  // Select customer via combobox
  await page.getByPlaceholder('Search customers...').click();
  await page.getByPlaceholder('Search customers...').fill('Cathy');
  await page.waitForTimeout(700);
  await shot('02-booking-form-customer-search.png');
  await page.getByRole('option', { name: /Cathy Customer/ }).click();

  // Select branch
  await page.getByRole('combobox').filter({ hasText: 'Select a branch' }).click();
  await page.getByRole('option', { name: 'Main Branch' }).click();

  // Add service
  await page.getByRole('combobox').filter({ hasText: 'Select a service to add' }).click();
  await page.getByRole('option', { name: /Haircut/ }).click();
  await page.getByRole('button', { name: 'Add' }).click();

  // Assign staff
  await page.getByRole('button', { name: 'Assign staff' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('menuitemcheckbox', { name: /Emma Employee/ }).click();
  await page.keyboard.press('Escape');

  await shot('03-booking-form-filled.png');

  await page.getByRole('button', { name: 'Create booking' }).click();
  await page.waitForURL((url) => /^\/app\/bookings\/[0-9a-f-]{36}$/.test(url.pathname), { timeout: 10000 });
  console.log('Booking detail URL:', page.url());
  const bookingId = page.url().split('/').pop();
  await page.waitForTimeout(500);
  await shot('04-booking-detail-after-create.png');

  // ---- 3. Verify status + Booked by ----
  const statusText = await page.locator('text=Status').locator('xpath=following-sibling::*[1]').first().innerText().catch(() => 'N/A');
  console.log('Status field text:', statusText);

  const bookedByLabel = page.getByText('Booked by').locator('xpath=following-sibling::p[1]');
  const bookedByText = await bookedByLabel.innerText();
  console.log('Booked by:', bookedByText);

  // ---- 4. Logout, login as employee ----
  console.log('=== Login as employee ===');
  await page.goto(`${FRONTEND}/login`);
  // clear local storage / cookies to ensure fresh session
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await login(EMP_EMAIL, EMP_PASSWORD);
  await shot('05-employee-dashboard.png');

  // ---- 5. Check nav label "My Queue" ----
  const navLink = page.getByRole('link', { name: 'My Queue' });
  await navLink.waitFor({ timeout: 5000 });
  console.log('Nav link "My Queue" found');
  await navLink.click();
  await page.waitForURL(/\/app\/my-services/);
  await page.getByText(/BK-/).first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await shot('06-my-queue-initial.png');

  // ---- 6. Verify queue row ----
  const queueRowText = await page.locator('table').first().innerText();
  console.log('Queue table text:\n', queueRowText);

  // ---- 7. Click Start on position #1 ----
  console.log('=== Click Start (row #1) ===');
  const row1 = page.getByRole('row', { name: /^1 / });
  await row1.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(1000);
  await shot('07-after-start.png');
  const queueRowTextAfterStart = await page.locator('table').first().innerText();
  console.log('Queue table after Start:\n', queueRowTextAfterStart);

  // ---- 8. Click Complete on row #1 ----
  console.log('=== Click Complete (row #1) ===');
  await row1.getByRole('button', { name: /Complete/ }).click();
  await page.waitForTimeout(1000);
  await shot('08-after-complete.png');
  const queueAfterComplete = await page.locator('table').first().innerText();
  console.log('Queue table after Complete:\n', queueAfterComplete);

  const historyTable = await page.locator('table').nth(1).innerText();
  console.log('History table after Complete:\n', historyTable);

  console.log('\nBOOKING_ID=' + bookingId);
} catch (err) {
  console.error('ERROR:', err);
  await shot('ERROR.png').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
