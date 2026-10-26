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
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '3D Digital Twin', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
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
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start Heater', exact: true }).click();
  await expect(page.locator('.command-result')).toContainText('acknowledged');
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('ON');
  await page.getByRole('link', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Inject thermal trip' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'THERMAL TRIP' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reset latched fault' })).toBeDisabled();
  await page.getByRole('button', { name: 'Restore sensor & cool down' }).click();
  await page.getByRole('button', { name: 'Reset latched fault' }).click();
  await page.getByRole('button', { name: 'Confirm reset' }).click();
  await expect(page.locator('.fault-banner')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Heater', exact: true }).click();
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
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
});
test('hidden tab loses heartbeat and E-stop latches', async ({ page }) => {
  await page.goto('/control');
  await page.getByRole('button', { name: 'Start simulation', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start Heater', exact: true }).click();
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
