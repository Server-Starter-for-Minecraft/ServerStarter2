import { Failable } from 'src-electron/api/failable';
import * as child_process from 'child_process';
import { utilLoggers } from './logger';

const loggers = utilLoggers.child('subprocess');

export type ChildProcessPromise = Promise<Failable<undefined>> & {
  kill(signal?: number | NodeJS.Signals | undefined): boolean;
  write(msg: string): Promise<void>;
};

function promissifyProcess(
  process: child_process.ChildProcess,
  processpath: string,
  args: string[]
) {
  const logger = loggers.operation('promissifyProcess', {
    command: processpath + ' ' + args.join(' '),
  });
  logger.start();

  function onExit(code: number | null) {
    if (code === 0 || code === null) return undefined;
    const command = processpath + ' ' + args.join(' ');
    return new Error(
      `error occured in running subprocess with exitcode:${code} command:${command}}`
    );
  }

  const executor: (
    resolve: (
      value: Failable<undefined> | PromiseLike<Failable<undefined>>
    ) => void
  ) => void = (resolve) => {
    process.on('exit', (code) => resolve(onExit(code)));
    process.on('error', (err) => resolve(err));
  };

  const promise = new Promise(executor) as ChildProcessPromise;

  const kill = (signal?: number | NodeJS.Signals | undefined): boolean => {
    return process.kill(signal);
  };

  const write = (msg: string) =>
    new Promise<void>((resolve) =>
      process.stdin?.write(msg + '\n', () => resolve())
    );
  promise.kill = kill;
  promise.write = write;

  promise.then(
    (x) => {
      logger.success();
      return x;
    },
    (x) => {
      logger.fail(x);
      return x;
    }
  );

  return promise;
}

export const interactiveProcess = (
  process: string,
  args: string[],
  onout: ((chunk: string) => void) | undefined,
  onerr: ((chunk: string) => void) | undefined,
  cwd: string | undefined = undefined,
  shell = false
): ChildProcessPromise => {
  const child = child_process.spawn(process, args, {
    cwd,
    shell,
    stdio: ['pipe', onout ? 'pipe' : 'ignore', onerr ? 'pipe' : 'ignore'],
  });

  if (onout) {
    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', onout);
  }

  if (onerr) {
    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', onerr);
  }

  return promissifyProcess(child, process, args);
};

export function execProcess(
  process: string,
  args: string[],
  cwd: string | undefined = undefined,
  shell = false
) {
  const child = child_process.spawn(process, args, { cwd, shell });
  return promissifyProcess(child, process, args);
}
