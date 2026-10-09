import * as child_process from 'child_process';
import { Failable } from 'app/src-electron/util/error/failable';
import { onQuit } from '../../lifecycle/lifecycle';
import { errorMessage } from '../error/construct';
import { fromRuntimeError } from '../error/error';
import { sleep } from '../promise/sleep';
import { utilLoggers } from '../utilLogger';
import { Path } from './path';

const loggers = () => utilLoggers().subprocess;

export type ChildProcessPromise = Promise<Failable<undefined>> & {
  finished(): boolean;
  kill(signal?: number | NodeJS.Signals | undefined): Promise<void>;
  write(msg: string): Promise<void>;
};

function promissifyProcess(
  process: child_process.ChildProcess,
  processPath: Path,
  args: string[],
  beforeKill: (child: ChildProcessPromise) => void | Promise<void> = () => {},
  beforeKillTimeout = 1000
) {
  const logger = loggers().promissifyProcess({
    command: `${processPath.quotedPath} ${args.join(' ')}`,
  });
  logger.info('start');

  let isFinished = false;

  function onExit(code: number | null): Failable<undefined> {
    if (code === 0 || code === null) return undefined;
    return errorMessage.system.subprocess({
      processPath: processPath.quotedPath,
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
      logger.info(['success', code]);
      isFinished = true;
      // プロセスkillの購読を解除
      dispatch();
      resolve(onExit(code));
    });
    process.on('error', (err) => {
      logger.error(err);
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
      if (process.stdin) process.stdin.write(`${msg}\n`, () => resolve());
      else resolve();
    });
  promise.kill = kill;
  promise.write = write;

  return promise;
}

/**
 * 標準入出力をやり取りできる子プロセスを起動する
 *
 * シェルを介さずに実行ファイルを直接起動するため，引数はエスケープや引用符で囲む必要がなく，
 * スペースやシェルの特殊文字を含む値もそのまま1つの引数として渡される
 *
 * @param process 起動する実行ファイルのパス
 * @param args 実行ファイルに渡す引数（1要素が1つの引数となる）
 * @param onout 標準出力を受け取るコールバック（未指定の場合は出力を破棄する）
 * @param onerr 標準エラー出力を受け取るコールバック（未指定の場合は出力を破棄する）
 * @param cwd 作業ディレクトリ
 * @param beforeKill プロセスをkillする前に実行する処理
 * @param beforeKillTimeout `beforeKill`の完了を待つ最大時間（ミリ秒）
 */
export const interactiveProcess = (
  process: Path,
  args: string[],
  onout: ((chunk: string) => void) | undefined,
  onerr: ((chunk: string) => void) | undefined,
  cwd: Path | undefined = undefined,
  beforeKill: (child: ChildProcessPromise) => void | Promise<void> = () => {},
  beforeKillTimeout = 1000
): ChildProcessPromise => {
  const child = child_process.spawn(process.path, args, {
    cwd: cwd?.path,
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

/**
 * 子プロセスを起動して終了を待つ
 *
 * `interactiveProcess`と同様に，シェルを介さずに実行ファイルを直接起動する
 *
 * @param process 起動する実行ファイルのパス
 * @param args 実行ファイルに渡す引数（1要素が1つの引数となる）
 * @param cwd 作業ディレクトリ
 */
export function execProcess(
  process: Path,
  args: string[],
  cwd: Path | undefined = undefined
) {
  const child = child_process.spawn(process.path, args, {
    cwd: cwd?.path,
  });
  return promissifyProcess(child, process, args);
}
