import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'algaerhythm-settings',
      JSON.stringify({
        state: { tourDone: true, quality: 'low', reducedMotion: true },
        version: 1,
      }),
    ),
  );
});
test('starts disconnected, renders actual 3D and accessible reference layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '3D Digital Twin', exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeDisabled();
  await expect(page.getByText('Not instrumented', { exact: true })).toBeVisible();
  await expect(page.locator('.scene-canvas canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Exploded', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exploded', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Top', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '../work/dashboard-desktop.png', fullPage: true });
});
test('simulation records data, acknowledges heat, trips and resets safely, exports and replays', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await expect(
    page.getByText('SIMULATION — NO PHYSICAL DEVICE CONNECTED', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeEnabled();
  await page.getByRole('switch', { name: 'Heater power', exact: true }).click();
  await expect(page.locator('.command-result')).toContainText('acknowledged');
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('ON');
  await page.getByRole('link', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Inject thermal trip' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'THERMAL TRIP' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reset latched fault' })).toBeDisabled();
  await page.getByRole('button', { name: 'Restore sensor & cool down' }).click();
  await page.getByRole('button', { name: 'Reset latched fault' }).click();
  await page.getByRole('button', { name: 'Confirm reset' }).click();
  await expect(page.locator('.fault-banner')).toHaveCount(0);
  await page.getByRole('switch', { name: 'Heater power', exact: true }).click();
  await page.getByRole('button', { name: 'Pause heartbeat', exact: true }).click();
  await expect(page.locator('.fault-banner')).toContainText('LINK TIMEOUT', { timeout: 10000 });
  await page.getByRole('button', { name: 'Resume heartbeat', exact: true }).click();
  await page.getByRole('link', { name: 'Experiments', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay', exact: false })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Export Simulation/ }).click();
  const csv = await download;
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('button', { name: /^Replay Simulation/ }).click();
  await expect(page.locator('.source-banner.replay')).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Replay position' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeDisabled();
});
test('hidden tab loses heartbeat and E-stop latches', async ({ page }) => {
  await page.goto('/control');
  await page.getByRole('button', { name: 'Start simulation', exact: true }).first().click();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeEnabled();
  await page.getByRole('switch', { name: 'Heater power', exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.fault-banner')).toContainText('LINK TIMEOUT', { timeout: 10000 });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: 'E-STOP', exact: true }).click();
  await expect(page.locator('.fault-banner')).toContainText('E STOP');
});
test('opens expanded twin controls during an active telemetry stream', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await page.getByRole('link', { name: '3D Digital Twin', exact: true }).click();
  await expect(page.getByLabel('Reference green · conceptual')).toBeVisible();
  await page.getByLabel('Inspect component').selectOption('reactor');
  await page.getByRole('button', { name: 'Focus component', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Camera', exact: true })).toHaveValue('Focus');
  await page.getByRole('button', { name: 'Hide component', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Show component', exact: true })).toBeVisible();
});
test('real local compute executes and stops without energizing hardware', async ({ page }) => {
  await page.goto('/compute');
  await page.getByRole('button', { name: 'Run compute', exact: true }).click();
  await expect(
    page
      .locator('.metric')
      .filter({ has: page.locator('.metric-label').filter({ hasText: 'Completed jobs' }) })
      .locator('strong'),
  ).not.toHaveText('Unavailable');
  await expect(
    page
      .locator('.metric')
      .filter({ has: page.locator('.metric-label').filter({ hasText: 'Completed jobs' }) })
      .locator('strong'),
  ).toHaveText(/[1-9]/);
  await page.getByRole('button', { name: 'Stop compute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run compute', exact: true })).toBeVisible();
  await expect(page.locator('.header-status')).toContainText('DISCONNECTED');
});
test('manual heater OFF takes ownership from a running compute workload and stays OFF', async ({
  page,
}) => {
  await page.goto('/compute');
  await page.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await page.getByRole('button', { name: 'Run compute', exact: true }).click();
  const link = page.getByRole('checkbox', { name: 'Link compute workload to heater demand' });
  await expect(link).toBeEnabled();
  await link.check();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  const power = page.getByRole('switch', { name: 'Heater power', exact: true });
  await expect(power).toBeChecked();
  await page.getByRole('button', { name: 'Stop Heater', exact: true }).click();
  await expect(power).not.toBeChecked();
  await page.getByRole('link', { name: 'Compute Demo', exact: true }).click();
  await expect(link).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Stop compute', exact: true })).toBeVisible();
  // The compute worker remains active past the restart dwell, but its demand
  // must not take control back from the operator's OFF request.
  await page.waitForTimeout(5500);
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(power).not.toBeChecked();
  await expect(page.locator('.error-banner')).toHaveCount(0);
});
test('training reports a real learning curve and converges without heater control', async ({
  page,
}) => {
  await page.goto('/compute');
  await page.getByLabel('Job type').selectOption('training');
  await page.getByRole('button', { name: 'Run compute', exact: true }).click();
  await expect(page.locator('.loss-summary')).toContainText('Training in progress');
  await expect(page.locator('.loss-summary')).toContainText('Converged', { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Run compute', exact: true })).toBeVisible();
  await expect(page.locator('.training-loss-panel svg[role="img"]')).toHaveAttribute(
    'aria-label',
    /Training MSE decreased/,
  );
  await expect(page.locator('.loss-summary')).toContainText('coefficient 1.998');
  await expect(page.locator('.header-status')).toContainText('DISCONNECTED');
});
test('requested target spans 25–50 while retaining the configured hardware ceiling', async ({
  page,
}) => {
  await page.goto('/');
  const target = page.getByRole('spinbutton', { name: 'Requested target in Celsius' });
  await expect(target).toHaveAttribute('min', '25');
  await expect(target).toHaveAttribute('max', '50');
  await target.fill('50');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(target).toHaveValue('50');
  await expect(page.getByText(/Applied ceiling: 35.0 °C/)).toBeVisible();
  await target.fill('25');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText(/Applied ceiling: 25.0 °C/)).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await expect(target).toHaveValue('25');
  await target.fill('35');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Heater power', exact: true })).toBeEnabled();
  await page.getByRole('switch', { name: 'Heater power', exact: true }).click();
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('ON');
  await target.fill('25');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('OFF');
});
test('all routes render and mobile has no page overflow', async ({ page }) => {
  for (const [path, title] of [
    ['/monitor', 'Live Monitoring'],
    ['/thermal', 'Thermal Analytics'],
    ['/experiments', 'Experiments'],
    ['/modes', 'Reactor Modes'],
    ['/chemistry', 'Chemical Research'],
    ['/algae', 'Spirulina Photobioreactor'],
    ['/assistant', 'AI Research Assistant'],
    ['/hardware', 'Hardware Setup'],
    ['/logs', 'Data Logs'],
    ['/settings', 'Settings'],
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '3D Digital Twin', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('link', { name: 'Controls', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Controls', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hardware Controls' })).toBeVisible();
  await page.screenshot({ path: '../work/dashboard-mobile.png', fullPage: true });
});
