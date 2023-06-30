import { Failable } from 'app/src-electron/util/error/failable';
import * as child_process from 'child_process';
import { utilLoggers } from './utilLogger';
import { sleep } from './sleep';
import { onQuit } from '../lifecycle/lifecycle';
import { fromRuntimeError } from './error/error';
import { errorMessage } from './error/construct';

const loggers = utilLoggers.subprocess;

export type ChildProcessPromise = Promise<Failable<undefined>> & {
  finished(): boolean;
  kill(signal?: number | NodeJS.Signals | undefined): Promise<void>;
  write(msg: string): Promise<void>;
};

function promissifyProcess(
  process: child_process.ChildProcess,
  processPath: string,
  args: string[],
  beforeKill: (child: ChildProcessPromise) => void | Promise<void> = () => {},
  beforeKillTimeout = 1000
) {
  const logger = loggers.promissifyProcess({
    command: processPath + ' ' + args.join(' '),
  });
  logger.start();

  let isFinished = false;

  function onExit(code: number | null): Failable<undefined> {
    if (code === 0 || code === null) return undefined;
    return errorMessage.system.subprocess({
      processPath,
      args,
      exitcode: code,
    });
  }

  const executor: (
    resolve: (
      value: Failable<undefined> | PromiseLike<Failable<undefined>>
    ) => void
  ) => void = (resolve) => {
    process.on('exit', (code) => {
      logger.success(code);
      isFinished = true;
      // プロセスkillの購読を解除
      dispatch();
      resolve(onExit(code));
    });
    process.on('error', (err) => {
      logger.fail(err);
      isFinished = true;
      // プロセスkillの購読を解除
      dispatch();
      resolve(fromRuntimeError(err));
    });
  };

  const promise = new Promise(executor) as ChildProcessPromise;

  promise.finished = () => isFinished;

  const kill = async (
    signal?: number | NodeJS.Signals | undefined
  ): Promise<void> => {
    if (process.exitCode === null) {
      // killの前処理
      await Promise.any([beforeKill(promise), sleep(beforeKillTimeout)]);
      try {
        process.kill(signal);
      } catch (e) {
        logger.warn('failed to kill process');
      }
    }
  };

  // アプリケーション終了時にプロセスをkill
  const dispatch = onQuit(() => kill(), true);

  const write = (msg: string) =>
    new Promise<void>((resolve) => {
      if (process.stdin) process.stdin.write(msg + '\n', () => resolve());
      else resolve();
    });
  promise.kill = kill;
  promise.write = write;

  return promise;
}

export const interactiveProcess = (
  process: string,
  args: string[],
  onout: ((chunk: string) => void) | undefined,
  onerr: ((chunk: string) => void) | undefined,
  cwd: string | undefined = undefined,
  shell = false,
  beforeKill: (child: ChildProcessPromise) => void | Promise<void> = () => {},
  beforeKillTimeout = 1000
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

  const result = promissifyProcess(
    child,
    process,
    args,
    beforeKill,
    beforeKillTimeout
  );

  return result;
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
