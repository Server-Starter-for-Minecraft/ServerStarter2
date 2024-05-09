import { type spawn as _spawn } from 'child_process';
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

  match(config: ChildProcessConfig) {
    return this.configFilter(config);
  }
}

const a = new ChildProcessMockCase(
  {
    command: 'java',
  },
  async (_, io) => {
    io.stderr.write('say hello');
    io.stdout.write('say hello');
    return 0;
  }
);

type ChildProcessMockOptions = {
  /** 条件に当てはまる最初のケースが使用される */
  mockCases: ChildProcessMockCase[];
};

const getChildProcessMock = (options: ChildProcessMockOptions) => {
  const findCase = (config: ChildProcessConfig) => {
    const mockCase = options.mockCases.find((c) => c.match(config));
    if (mockCase === undefined) {
      throw new Error('mock case not found');
    }
  };
  return {};
};
