import { test, expect } from '@playwright/test';
declare global {
  interface Window {
    serialFixture: {
      send: (data: string) => void;
      paused: boolean;
      dropAcks: boolean;
      writes: Array<{ cmd: string; value?: number; id?: number }>;
      closed: boolean;
    };
  }
}
test('Web Serial fixture validates lines, acknowledges commands, detects staleness and fails safe on missing ack', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'algaerhythm-settings',
      JSON.stringify({
        state: { tourDone: true, quality: 'low', reducedMotion: true },
        version: 1,
      }),
    );
    let input: ReadableStreamDefaultController<Uint8Array>,
      heater = 0,
      seq = 0;
    const encoder = new TextEncoder();
    let interval: ReturnType<typeof setInterval>;
    const fixture = {
      paused: false,
      dropAcks: false,
      writes: [] as Array<{ cmd: string; value?: number; id?: number }>,
      closed: false,
      send: (line: string) => input.enqueue(encoder.encode(line)),
    };
    window.serialFixture = fixture;
    const emit = (ack?: number) => {
      if (fixture.paused) return;
      fixture.send(
        JSON.stringify({
          v: 2,
          temp: 28.4,
          temp2: null,
          gas: 1820,
          heater,
          fault: 0,
          trip_c: 35.5,
          armed: true,
          seq: seq++,
          ...(ack !== undefined && !fixture.dropAcks ? { ack, accepted: true } : {}),
        }) + '\n',
      );
    };
    const port = {
      readable: new ReadableStream<Uint8Array>({
        start(c) {
          input = c;
        },
        cancel() {
          clearInterval(interval);
        },
      }),
      writable: new WritableStream<Uint8Array>({
        write(bytes) {
          const c = JSON.parse(new TextDecoder().decode(bytes)) as {
            cmd: string;
            value?: number;
            id?: number;
          };
          fixture.writes.push(c);
          if (c.cmd === 'heater') heater = c.value ?? 0;
          if (c.cmd === 'estop') heater = 0;
          if (c.cmd !== 'heartbeat') emit(c.id);
        },
      }),
      open: async () => {
        interval = setInterval(() => emit(), 500);
        emit();
      },
      close: async () => {
        clearInterval(interval);
        fixture.closed = true;
      },
    };
    Object.defineProperty(navigator, 'serial', {
      value: { requestPort: async () => port },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect ESP32', exact: true }).click();
  await expect(
    page.locator('.status-card').filter({ hasText: 'Reactor Temperature' }).locator('strong'),
  ).toHaveText('28.4 °C');
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeEnabled();
  await page.evaluate(() => window.serialFixture.send('bad-json\n'));
  await expect(page.locator('.event-list')).toContainText('Rejected telemetry');
  await page.getByRole('button', { name: 'Start Heater', exact: true }).click();
  await expect(page.locator('.command-result')).toContainText('acknowledged');
  await page.getByRole('button', { name: 'Stop Heater', exact: true }).click();
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('OFF');
  await page.evaluate(() => {
    window.serialFixture.dropAcks = true;
  });
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start Heater', exact: true }).click();
  await expect(page.locator('.command-result')).toContainText('timeout');
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.serialFixture.writes.at(-1)?.cmd === 'heartbeat'
          ? window.serialFixture.writes.filter((c) => c.cmd === 'heater').at(-1)?.value
          : window.serialFixture.writes.at(-1)?.value,
      ),
    )
    .toBe(0);
  await page.evaluate(() => {
    window.serialFixture.paused = true;
  });
  await expect(page.getByText('STALE TELEMETRY', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Disconnect source', exact: true }).click();
  await expect(page.locator('.header-status')).toContainText('DISCONNECTED');
  expect(await page.evaluate(() => window.serialFixture.closed)).toBe(true);
});
