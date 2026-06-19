import { chromium } from 'playwright-core';

const FRONTEND = 'http://localhost:5173';
const empEmail = 'queue-employee-1781282211756@example.com';
const empPassword = 'NewPassword123!';

const browser = await chromium.launch();

const shot = (page, name) => page.screenshot({ path: `/tmp/wh_shots/q-${name}.png`, fullPage: true });

try {
  const empPage = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  empPage.on('console', (msg) => console.log('  [console]', msg.type(), msg.text()));
  empPage.on('pageerror', (err) => console.log('  [pageerror]', err.message));
  empPage.on('requestfailed', (req) => console.log('  [requestfailed]', req.url(), req.failure()?.errorText));

  await empPage.goto(`${FRONTEND}/login`);
  await empPage.fill('input[name="email"]', empEmail);
  await empPage.fill('input[name="password"]', empPassword);
  await empPage.click('button[type="submit"]');
  await empPage.waitForURL(`${FRONTEND}/app`, { timeout: 15000 });
  console.log('\nLogged in as employee, landed on:', empPage.url());

  const navText = await empPage.locator('aside').innerText();
  console.log('Sidebar nav items (employee):');
  console.log(navText);
  console.log('Sidebar contains "Queues":', navText.includes('Queues'));

  // Direct hard-reload navigation to /app/queues
  await empPage.goto(`${FRONTEND}/app/queues`);

  // Poll for up to 15s to see where it settles
  for (let i = 0; i < 15; i++) {
    await empPage.waitForTimeout(1000);
    const url = empPage.url();
    console.log(`  t=${i + 1}s url=${url}`);
    if (!url.endsWith('/app/queues') || i === 14) {
      break;
    }
    const bodyText = await empPage.locator('body').innerText().catch(() => '');
    if (!bodyText.includes('Loading')) {
      console.log('  body (no longer "Loading"):', bodyText.slice(0, 300));
      break;
    }
  }

  console.log('Final URL after direct nav to /app/queues as employee:', empPage.url());
  await shot(empPage, '06-employee-queues-guard');

  await empPage.close();

  console.log('\nDONE');
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  await browser.close();
}
