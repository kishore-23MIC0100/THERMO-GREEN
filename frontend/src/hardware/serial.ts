import { LineBuffer } from './protocol';
import type { Command } from './protocol';
export interface Transport {
  send(command: Command): Promise<void>;
  close(): Promise<void>;
}
export class SerialTransport implements Transport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readTask: Promise<void> | null = null;
  private closing = false;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private onLine: (line: string) => void,
    private onError: (error: Error) => void,
  ) {}
  async connect(baudRate = 115200) {
    if (!('serial' in navigator))
      throw new Error('Web Serial needs Chrome or Edge on desktop, over localhost or HTTPS.');
    this.port = await navigator.serial.requestPort();
    try {
      await this.port.open({ baudRate });
      this.writer = this.port.writable!.getWriter();
      this.readTask = this.read();
    } catch (e) {
      await this.close();
      throw e;
    }
  }
  private async read() {
    const decoder = new TextDecoder();
    const lines = new LineBuffer();
    this.reader = this.port!.readable!.getReader();
    try {
      while (!this.closing) {
        const { value, done } = await this.reader.read();
        if (done) {
          if (!this.closing) this.onError(new Error('USB device disconnected'));
          break;
        }
        if (value)
          for (const line of lines.push(decoder.decode(value, { stream: true }))) this.onLine(line);
      }
    } catch (e) {
      if (!this.closing) this.onError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      this.reader?.releaseLock();
      this.reader = null;
    }
  }
  send(command: Command) {
    const task = this.writes
      .catch(() => {})
      .then(async () => {
        if (!this.writer) throw new Error('Serial port is closed');
        await this.writer.write(new TextEncoder().encode(JSON.stringify(command) + '\n'));
      });
    this.writes = task;
    return task;
  }
  async close() {
    this.closing = true;
    await this.reader?.cancel().catch(() => {});
    await this.readTask?.catch(() => {});
    await this.writes.catch(() => {});
    this.writer?.releaseLock();
    this.writer = null;
    await this.port?.close().catch(() => {});
    this.port = null;
  }
}
export class SimulatorTransport implements Transport {
  worker: Worker;
  constructor(onLine: (line: string) => void, onError: (error: Error) => void) {
    this.worker = new Worker(new URL('./simulator.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => onLine(String(e.data));
    this.worker.onerror = (e) => onError(new Error(e.message || 'Simulator worker stopped'));
  }
  async send(command: Command) {
    this.worker.postMessage({ type: 'command', command });
  }
  async close() {
    this.worker.terminate();
  }
}
