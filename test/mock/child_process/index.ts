import type { spawn as _spawn } from 'child_process';
import {
  ChildProcessConfig,
  ConfigFilter,
  normalizeConfigFilter,
} from './filter';
import { Readable, Writable } from 'stream';

type StdIO = {
  stdin: Readable;
  stdout: Writable;
  stderr: Writable;
};

class ChildProcessMockCase {
  configFilter: (config: ChildProcessConfig) => boolean;
  process: (config: ChildProcessConfig, io: StdIO) => Promise<number>;

  constructor(
    config: ConfigFilter,
    process: (config: ChildProcessConfig, io: StdIO) => Promise<number>
  ) {
    this.configFilter = normalizeConfigFilter(config);
    this.process = process;
  }
}

new ChildProcessMockCase(
  {
    command: 'java',
  },
  async (_, io) => {
    io.stderr.write('say hello');
    io.stdout.write('say hello');
    return 0;
  }
);

export const spawn: typeof _spawn = (...params: Params) => {
  const { command, args, option } = parseParams(...params);

  switch (command) {
    case 'a':
      break;
    default:
      throw new Error(`unknown process '${command}'`);
  }
};

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {
    expect(() => spawn('kusa')).toThrow();
  });
}
