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

declare global {
  interface Window {
    serialRecoveryFixture: {
      openRequested: boolean;
      releaseOpen: () => void;
      failWrites: boolean;
      writes: Array<{ cmd: string; id?: number; value?: number }>;
      setReadings: (temp: number, gas: number) => void;
    };
  }
}

test('waits for USB open, safely resets Arduino boot latches while unarmed, and disconnects on write failure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'algaerhythm-settings',
      JSON.stringify({
        state: { tourDone: true, quality: 'low', reducedMotion: true },
        version: 2,
      }),
    );
    let input!: ReadableStreamDefaultController<Uint8Array>;
    let opened = false,
      fault = 6,
      temp = 26.5,
      gas = 1860,
      seq = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const encoder = new TextEncoder();
    const emit = (ack?: number) =>
      input.enqueue(
        encoder.encode(
          JSON.stringify({
            v: 2,
            seq: seq++,
            uptime_ms: 62500,
            temp,
            temp2: null,
            gas,
            heater: 0,
            fault,
            trip_c: 35.5,
            armed: false,
            firmware: '1.0.0-arduino',
            ...(ack !== undefined ? { ack, accepted: true } : {}),
          }) + '\n',
        ),
      );
    const fixture = {
      openRequested: false,
      releaseOpen: () => {},
      failWrites: false,
      writes: [] as Array<{ cmd: string; id?: number; value?: number }>,
      setReadings: (nextTemp: number, nextGas: number) => {
        temp = nextTemp;
        gas = nextGas;
        emit();
      },
    };
    window.serialRecoveryFixture = fixture;
    const readable = new ReadableStream<Uint8Array>({
      start(c) {
        input = c;
      },
      cancel() {
        if (interval) clearInterval(interval);
      },
    });
    const writable = new WritableStream<Uint8Array>({
      write(bytes) {
        if (!opened || fixture.failWrites) throw new Error('fixture serial port closed');
        const command = JSON.parse(new TextDecoder().decode(bytes));
        fixture.writes.push(command);
        if (command.cmd === 'reset_fault') {
          fault = 0;
          emit(command.id);
        } else if (command.cmd !== 'heartbeat') emit(command.id);
      },
    });
    const port = {
      get readable() {
        return opened ? readable : null;
      },
      get writable() {
        return opened ? writable : null;
      },
      open: async () => {
        fixture.openRequested = true;
        await new Promise<void>((resolve) => {
          fixture.releaseOpen = () => {
            opened = true;
            input.enqueue(encoder.encode('ets Jun  8 2016 00:22:57\n'));
            emit();
            interval = setInterval(() => emit(), 500);
            resolve();
          };
        });
      },
      close: async () => {
        if (interval) clearInterval(interval);
        opened = false;
      },
    };
    Object.defineProperty(navigator, 'serial', {
      value: { requestPort: async () => port },
      configurable: true,
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect ESP32', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.serialRecoveryFixture.openRequested))
    .toBe(true);
  // Cross a heartbeat interval while port.open() is still pending.
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.serialRecoveryFixture.writes.length)).toBe(0);
  await expect(page.locator('.header-status')).toContainText('CONNECTING');
  await expect(page.locator('.error-banner')).toHaveCount(0);
  await page.evaluate(() => window.serialRecoveryFixture.releaseOpen());
  await expect(page.locator('.header-status')).toContainText('FAULT');
  await expect(page.locator('.fault-banner')).toContainText('latest probe values are valid');
  await expect(page.getByText(/Relay safety lock is enabled/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
  await expect(page.locator('.error-banner')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reset latched fault', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Reset latched fault', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm reset', exact: true }).click();
  await expect(page.locator('.fault-banner')).toHaveCount(0);
  await expect(page.locator('.header-status')).toContainText('LIVE');
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
  await expect(
    page.locator('.status-card').filter({ hasText: 'Heater Status' }).locator('strong'),
  ).toHaveText('OFF');
  await page.evaluate(() => window.serialRecoveryFixture.setReadings(27.125, 1723));
  await expect(
    page.locator('.status-card').filter({ hasText: 'Reactor Temperature' }).locator('strong'),
  ).toHaveText('27.1 °C');
  await expect(page.locator('.scene-reading')).toContainText('27.1 °C');
  await expect(
    page.locator('.status-card').filter({ hasText: 'Gas Sensor' }).locator('strong'),
  ).toHaveText('1723');
  await page.evaluate(() => {
    window.serialRecoveryFixture.failWrites = true;
  });
  await expect(page.locator('.header-status')).toContainText('DISCONNECTED');
  await expect(page.locator('.error-banner')).toContainText('USB connection ended');
  await expect(page.getByRole('button', { name: 'Start Heater', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});
