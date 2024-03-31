import type {
  spawn as _spawn,
  SpawnOptionsWithStdioTuple,
  SpawnOptionsWithoutStdio,
  StdioPipe,
  StdioNull,
} from 'child_process';
import { isDeepStrictEqual } from 'util';

type Stdio = StdioPipe | StdioNull;

type ChildProcessOptions =
  | undefined
  | SpawnOptionsWithoutStdio
  | SpawnOptionsWithStdioTuple<Stdio, Stdio, Stdio>;

type ChildProcessConfig = {
  command: string;
  args?: readonly string[];
  options?: ChildProcessOptions;
};

export type CommandFilter =
  | undefined
  | string
  | RegExp
  | ((command: string) => boolean);

export type ArgsFilter =
  | undefined
  | readonly (string | RegExp)[]
  | ((args: readonly string[] | undefined) => boolean);

export type OptionsFilter =
  | undefined
  | Partial<ChildProcessOptions>
  | ((options: ChildProcessOptions) => boolean);

export type ConfigFilter =
  | undefined
  | {
      command?: CommandFilter;
      args?: ArgsFilter;
      options?: OptionsFilter;
    }
  | ((config: ChildProcessConfig) => boolean);

export function normalizeCommandFilter(
  config: CommandFilter
): (command: string) => boolean {
  if (config === undefined) return (_) => true;
  if (typeof config === 'string') return (cmd) => cmd === config;
  if (typeof config === 'function') return config;
  if (config instanceof RegExp) return (cmd) => config.test(cmd);
  throw new Error(`unknowen command config value: '${config}'`);
}

export function normalizeArgsFilter(
  config: ArgsFilter
): (command: readonly string[] | undefined) => boolean {
  if (config === undefined) return (_) => true;
  if (typeof config === 'function') return config;
  if (Array.isArray(config)) {
    const arr = config.map((conf): ((arg: string) => boolean) => {
      if (typeof conf === 'string') return (arg) => conf === arg;
      if (conf instanceof RegExp) return (cmd) => conf.test(cmd);
      throw new Error(`unknowen arg config item value: '${conf}'`);
    });

    return (cmd) => {
      if (cmd === undefined) return false;
      if (cmd.length !== config.length) return false;
      return arr.every((x, i) => x(cmd[i]));
    };
  }
  throw new Error(`unknowen arg config value: '${config}'`);
}

export function normalizeOptionsFilter(
  config: OptionsFilter
): (options: ChildProcessOptions) => boolean {
  if (config === undefined) return (_) => true;
  if (typeof config === 'function') return config;
  if (typeof config === 'object') {
    return (opt) =>
      Object.entries(config).every(([k, v]) => isDeepStrictEqual(opt?.[k], v));
  }
  throw new Error(`unknowen arg config value: '${config}'`);
}

export function normalizeConfigFilter(
  config: ConfigFilter
): (options: ChildProcessConfig) => boolean {
  if (config === undefined) return (_) => true;
  if (typeof config === 'function') return config;
  if (typeof config === 'object') {
    const cmd = normalizeCommandFilter(config.command);
    const args = normalizeArgsFilter(config.args);
    const options = normalizeOptionsFilter(config.options);
    return (conf) => {
      return cmd(conf.command) && args(conf.args) && options(conf.options);
    };
  }
  throw new Error(`unknowen arg config value: '${config}'`);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('normalizeCommandFilter', () => {
    test('undefined', () => {
      const filter = normalizeCommandFilter(undefined);
      expect(filter('foo')).toEqual(true);
    });
    test('string', () => {
      const filter = normalizeCommandFilter('foo');
      expect(filter('foo')).toEqual(true);
      expect(filter('bar')).toEqual(false);
    });
    test('regex', () => {
      const filter = normalizeCommandFilter(/foo/);
      expect(filter('foo')).toEqual(true);
      expect(filter('xfoox')).toEqual(true);
      expect(filter('bar')).toEqual(false);
    });
    test('function', () => {
      const filter = normalizeCommandFilter((cmd) => cmd.startsWith('foo'));
      expect(filter('foo')).toEqual(true);
      expect(filter('foox')).toEqual(true);
      expect(filter('xfoo')).toEqual(false);
    });
  });
  describe('normalizeArgsFilter', () => {
    test('undefined', () => {
      const filter = normalizeArgsFilter(undefined);
      expect(filter(undefined)).toEqual(true);
      expect(filter(['foo', 'bar'])).toEqual(true);
    });
    test('string', () => {
      const filter = normalizeArgsFilter(['foo', 'bar']);
      expect(filter(['foo', 'bar'])).toEqual(true);
      expect(filter(undefined)).toEqual(false);
      expect(filter(['foo'])).toEqual(false);
      expect(filter(['foo', 'bar', 'buz'])).toEqual(false);
    });
    test('regex', () => {
      const filter = normalizeArgsFilter([/foo/, /bar/]);
      expect(filter(['xfoox', 'xbarx'])).toEqual(true);
      expect(filter(undefined)).toEqual(false);
      expect(filter(['xfoox'])).toEqual(false);
      expect(filter(['xfoox', 'xbarx', 'xbuzx'])).toEqual(false);
    });
    test('function', () => {
      const filter = normalizeArgsFilter((cmd) => cmd?.[0] === 'foo');
      expect(filter(undefined)).toEqual(false);
      expect(filter(['foo'])).toEqual(true);
      expect(filter(['foo', 'bar'])).toEqual(true);
      expect(filter(['bar'])).toEqual(false);
    });
  });
  describe('normalizeOptionsFilter', () => {
    test('undefined', () => {
      const filter = normalizeOptionsFilter(undefined);
      expect(filter(undefined)).toEqual(true);
      expect(
        filter({
          cwd: 'test',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      ).toEqual(true);
    });
    test('{cwd}', () => {
      const filter = normalizeOptionsFilter({
        cwd: 'foo',
      });
      expect(filter(undefined)).toEqual(false);
      expect(
        filter({
          cwd: 'foo',
        })
      ).toEqual(true);
      expect(
        filter({
          cwd: 'foo',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      ).toEqual(true);
      expect(
        filter({
          cwd: 'bar',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      ).toEqual(false);
    });
    test('{cwd,stdio}', () => {
      const filter = normalizeOptionsFilter({
        cwd: 'foo',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(filter(undefined)).toEqual(false);
      expect(
        filter({
          cwd: 'foo',
        })
      ).toEqual(false);
      expect(
        filter({
          cwd: 'foo',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      ).toEqual(true);
      expect(
        filter({
          cwd: 'bar',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      ).toEqual(false);
      expect(
        filter({
          cwd: 'foo',
          stdio: ['pipe', 'pipe', 'ignore'],
        })
      ).toEqual(false);
    });
  });
  describe('normalizeConfigFilter', () => {
    const allConfig = {
      command: 'foo',
      args: ['bar', 'buz'],
      options: {
        cwd: 'quax',
        stdio: ['pipe', 'pipe', 'pipe'] as [Stdio, Stdio, Stdio],
      },
    };
    test('undefined', () => {
      const filter = normalizeConfigFilter(undefined);
      expect(filter(allConfig)).toEqual(true);
    });
    test('object', () => {
      const filter = normalizeConfigFilter({
        command: 'foo',
        args: ['bar', 'buz'],
        options: {
          cwd: 'quax',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      });
      expect(filter(allConfig)).toEqual(true);
      expect(
        filter({
          command: 'foo',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(true);
      expect(
        filter({
          command: 'FOO',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(false);
      expect(
        filter({
          command: 'foo',
          args: ['BAR', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(false);
      expect(
        filter({
          command: 'foo',
          args: ['bar', 'buz'],
          options: {
            cwd: 'QUAX',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(false);
      expect(
        filter({
          command: 'foo',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        })
      ).toEqual(false);
    });
    test('function', () => {
      const filter = normalizeConfigFilter((x) => x.command.startsWith('foo'));
      expect(filter(allConfig)).toEqual(true);
      expect(
        filter({
          command: 'foo',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(true);
      expect(
        filter({
          command: 'foox',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(true);
      expect(
        filter({
          command: 'xfoo',
          args: ['bar', 'buz'],
          options: {
            cwd: 'quax',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        })
      ).toEqual(false);
    });
  });
}
