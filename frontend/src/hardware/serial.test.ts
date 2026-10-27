import { it, expect, vi, afterEach } from 'vitest';
import { SerialTransport } from './serial';
let active: SerialTransport | null = null;
afterEach(async () => {
  await active?.close();
  active = null;
  vi.unstubAllGlobals();
});
it('reads partial USB chunks, preserves command order and releases stream locks', async () => {
  let receive!: ReadableStreamDefaultController<Uint8Array>;
  const writes: string[] = [];
  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      receive = c;
    },
  });
  const writable = new WritableStream<Uint8Array>({
    write(bytes) {
      writes.push(new TextDecoder().decode(bytes));
    },
  });
  const close = vi.fn().mockResolvedValue(undefined),
    open = vi.fn();
  const port = { readable, writable, open, close };
  vi.stubGlobal('navigator', { serial: { requestPort: vi.fn().mockResolvedValue(port) } });
  const lines: string[] = [],
    errors: Error[] = [];
  active = new SerialTransport(
    (line) => lines.push(line),
    (e) => errors.push(e),
  );
  await active.connect();
  const encoder = new TextEncoder();
  receive.enqueue(encoder.encode('{"temp":28,'));
  receive.enqueue(encoder.encode('"gas":1800,"heater":0,"fault":0}\n'));
  await vi.waitFor(() => expect(lines).toHaveLength(1));
  expect(JSON.parse(lines[0]).temp).toBe(28);
  await Promise.all([
    active.send({ cmd: 'heartbeat' }),
    active.send({ cmd: 'heater', value: 1, id: 5 }),
    active.send({ cmd: 'estop', id: 6 }),
  ]);
  expect(writes.map((line) => JSON.parse(line).cmd)).toEqual(['heartbeat', 'heater', 'estop']);
  await active.close();
  active = null;
  expect(close).toHaveBeenCalledOnce();
  expect(readable.locked).toBe(false);
  expect(writable.locked).toBe(false);
  expect(errors).toEqual([]);
});
it('reports an unexpected USB stream end', async () => {
  let receive!: ReadableStreamDefaultController<Uint8Array>;
  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      receive = c;
    },
  });
  const errors: Error[] = [];
  vi.stubGlobal('navigator', {
    serial: {
      requestPort: vi.fn().mockResolvedValue({
        readable,
        writable: new WritableStream(),
        open: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      }),
    },
  });
  active = new SerialTransport(
    () => {},
    (e) => errors.push(e),
  );
  await active.connect();
  receive.close();
  await vi.waitFor(() => expect(errors[0]?.message).toContain('disconnected'));
});
it('explains unsupported browser requirements', async () => {
  vi.stubGlobal('navigator', {});
  active = new SerialTransport(
    () => {},
    () => {},
  );
  await expect(active.connect()).rejects.toThrow('Chrome or Edge');
});
it('reports a write failure even when the read stream has not ended', async () => {
  const onError = vi.fn();
  const port = {
    readable: new ReadableStream(),
    writable: new WritableStream({
      write() {
        throw new Error('device unplugged');
      },
    }),
    open: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  vi.stubGlobal('navigator', { serial: { requestPort: vi.fn().mockResolvedValue(port) } });
  active = new SerialTransport(() => {}, onError);
  await active.connect();
  await expect(active.send({ cmd: 'heartbeat' })).rejects.toThrow('device unplugged');
  expect(onError).toHaveBeenCalledOnce();
  expect(onError.mock.calls[0][0].message).toContain('USB serial write failed');
  await active.close();
  expect(port.close).toHaveBeenCalledOnce();
});
it('does not open a device after the pending chooser was cancelled by the application', async () => {
  let choose!: (port: unknown) => void;
  const port = { open: vi.fn(), close: vi.fn() };
  vi.stubGlobal('navigator', {
    serial: {
      requestPort: () =>
        new Promise((resolve) => {
          choose = resolve;
        }),
    },
  });
  active = new SerialTransport(
    () => {},
    () => {},
  );
  const connecting = active.connect();
  await active.close();
  choose(port);
  await expect(connecting).rejects.toThrow('cancelled');
  expect(port.open).not.toHaveBeenCalled();
});
