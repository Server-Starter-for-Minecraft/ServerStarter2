import type {
  spawn as _spawn,
  SpawnOptionsWithStdioTuple,
  SpawnOptionsWithoutStdio,
  StdioPipe,
  StdioNull,
} from 'child_process';
import { ArgsFilter, CommandFilter } from './filter';

type Stdio = StdioPipe | StdioNull;

type ChildProcessOptions =
  | SpawnOptionsWithoutStdio
  | SpawnOptionsWithStdioTuple<Stdio, Stdio, Stdio>;

type ChildProcessMockCaseConfig = {
  command?: CommandFilter;
  args?: ArgsFilter;
  options?: ChildProcessOptions | ((options: ChildProcessOptions) => boolean);
};

type ChildProcessMockCaseParams = {
  command: string;
  args?: readonly string[];
  options?: ChildProcessOptions;
};

class ChildProcessMockCase {
  config:
    | ChildProcessMockCaseConfig
    | ((params: ChildProcessMockCaseParams) => boolean);

  constructor(
    config:
      | ChildProcessMockCaseConfig
      | ((params: ChildProcessMockCaseParams) => boolean)
  ) {
    if (typeof config !== 'function') {
      config;
    }
    this.config = config;
  }
}

new ChildProcessMockCase({
  command: 'java',
});

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
