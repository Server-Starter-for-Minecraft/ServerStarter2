import {
  ChildProcess,
  MessageOptions,
  SendHandle,
  Serializable,
  SpawnOptions,
} from 'child_process';
import EventEmitter from 'events';
import { Pipe, Readable, Writable } from 'stream';

export class MockChildProcess extends EventEmitter implements ChildProcess {
  stdin: Writable | null;
  stdout: Readable | null;
  stderr: Readable | null;
  channel?: Pipe | null | undefined;
  stdio: [
    Writable | null,
    // stdin
    Readable | null,
    // stdout
    Readable | null,
    // stderr
    Readable | Writable | null | undefined,
    // extra
    Readable | Writable | null | undefined // extra
  ];
  killed: boolean;
  pid?: number | undefined;

  /** 用途不明 */
  get connected(): boolean {
    throw new Error('not implemented');
  }

  exitCode: number | null;
  signalCode: NodeJS.Signals | null;

  /** 環境によって変わるので使用しないこと */
  get spawnargs(): string[] {
    throw new Error('not implemented');
  }

  /** 環境によって変わるので使用しないこと */
  get spawnfile(): string {
    throw new Error('not implemented');
  }

  cmd: string;
  args: Array<string>;
  options: SpawnOptions | undefined;

  constructor(cmd: string, args: Array<string>, options?: SpawnOptions) {
    super();
    this.cmd = cmd;
    this.options = options;
    this.args = args;
    this.killed = false;
    this.pid = undefined;
    this.exitCode = null;
    this.signalCode = null;
  }

  kill(signal?: NodeJS.Signals | number): boolean {
    if (signal !== undefined) throw new Error('not implemented');
    if (this.killed) return false;
    this.killed = true;
    this.signalCode = 'SIGTERM';
    return true;
  }

  send(
    message: Serializable,
    callback?: (error: Error | null) => void
  ): boolean;
  send(
    message: Serializable,
    sendHandle?: SendHandle,
    callback?: (error: Error | null) => void
  ): boolean;
  send(
    message: Serializable,
    sendHandle?: SendHandle,
    options?: MessageOptions,
    callback?: (error: Error | null) => void
  ): boolean;
  send(): boolean {
    throw new Error('not implemented');
  }

  disconnect(): void {
    throw new Error('not implemented');
  }
  unref(): void {
    throw new Error('not implemented');
  }
  ref(): void {
    throw new Error('not implemented');
  }

  addListener(event: string, listener: (...args: any[]) => void): this;
  addListener(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  addListener(event: 'disconnect', listener: () => void): this;
  addListener(event: 'error', listener: (err: Error) => void): this;
  addListener(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  addListener(
    event: 'message',
    listener: (message: Serializable, sendHandle: SendHandle) => void
  ): this;
  addListener(event: 'spawn', listener: () => void): this;
  addListener(): this {
    throw new Error('not implemented');
  }

  emit(event: string | symbol, ...args: any[]): boolean;
  emit(
    event: 'close',
    code: number | null,
    signal: NodeJS.Signals | null
  ): boolean;
  emit(event: 'disconnect'): boolean;
  emit(event: 'error', err: Error): boolean;
  emit(
    event: 'exit',
    code: number | null,
    signal: NodeJS.Signals | null
  ): boolean;
  emit(
    event: 'message',
    message: Serializable,
    sendHandle: SendHandle
  ): boolean;
  emit(event: 'spawn', listener: () => void): boolean;
  emit(): boolean {
    throw new Error('not implemented');
  }

  on(event: string, listener: (...args: any[]) => void): this;
  on(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  on(event: 'disconnect', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  on(
    event: 'message',
    listener: (message: Serializable, sendHandle: SendHandle) => void
  ): this;
  on(event: 'spawn', listener: () => void): this;
  on(): this {
    throw new Error('not implemented');
  }

  once(event: string, listener: (...args: any[]) => void): this;
  once(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  once(event: 'disconnect', listener: () => void): this;
  once(event: 'error', listener: (err: Error) => void): this;
  once(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  once(
    event: 'message',
    listener: (message: Serializable, sendHandle: SendHandle) => void
  ): this;
  once(event: 'spawn', listener: () => void): this;
  once(): this {
    throw new Error('not implemented');
  }

  prependListener(event: string, listener: (...args: any[]) => void): this;
  prependListener(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  prependListener(event: 'disconnect', listener: () => void): this;
  prependListener(event: 'error', listener: (err: Error) => void): this;
  prependListener(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  prependListener(
    event: 'message',
    listener: (message: Serializable, sendHandle: SendHandle) => void
  ): this;
  prependListener(event: 'spawn', listener: () => void): this;
  prependListener(): this {
    throw new Error('not implemented');
  }

  prependOnceListener(event: string, listener: (...args: any[]) => void): this;
  prependOnceListener(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  prependOnceListener(event: 'disconnect', listener: () => void): this;
  prependOnceListener(event: 'error', listener: (err: Error) => void): this;
  prependOnceListener(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): this;
  prependOnceListener(
    event: 'message',
    listener: (message: Serializable, sendHandle: SendHandle) => void
  ): this;
  prependOnceListener(event: 'spawn', listener: () => void): this;
  prependOnceListener(): this {
    throw new Error('not implemented');
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { spawn } = await import('child_process');

  const waitProcess = (process: ChildProcess) =>
    new Promise<void>((r) => {
      process.on('exit', () => {
        r();
      });
    });

  const realNode = () =>
    spawn('node', ['-v'], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

  const mockNode = () =>
    new MockChildProcess('node', ['-v'], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

  const cases = [realNode];
  test.each(cases)('exit', async (genProcess) => {
    const process = genProcess();

    process.stdout.on('data', (a: Buffer) => {});

    expect(process.exitCode).toBe(null);
    expect(process.signalCode).toBe(null);

    await waitProcess(process);

    expect(process.exitCode).toBe(0);
    expect(process.signalCode).toBe(null);
  });

  test.each(cases)('kill', async (genProcess) => {
    const process = genProcess();

    expect(process.exitCode).toBe(null);
    expect(process.signalCode).toBe(null);

    expect(process.killed).toBe(false);
    expect(process.kill()).toBe(true);

    expect(process.killed).toBe(true);
    expect(process.kill()).toBe(false);

    await waitProcess(process);

    expect(process.exitCode).toBe(null);
    expect(process.signalCode).toBe('SIGTERM');
  });
}
