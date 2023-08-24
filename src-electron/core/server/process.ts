import { Failable } from 'app/src-electron/schema/error';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/path';
import { decoratePromise } from 'app/src-electron/util/promiseDecorator';
import { interactiveProcess } from 'app/src-electron/util/subprocess';

export type ServerProcess = Promise<Failable<undefined>> & {
  runCommand: (command: string) => Promise<void>;
  kill: () => Promise<void>;
};

/** javaのサブプロセスを起動 */
export function serverProcess(
  cwdPath: Path,
  id: WorldID,
  javaPath: Path,
  args: string[],
  console: (value: string, isError: boolean) => void,
  onStart: () => void,
  onFinish: () => void
): ServerProcess {
  // javaのサブプロセスを起動
  // TODO: エラー出力先のハンドル

  const stdout = (chunk: string) => console(chunk, false);
  const stderr = (chunk: string) => console(chunk, true);

  const process = interactiveProcess(
    javaPath,
    args,
    stdout,
    stderr,
    cwdPath,
    true,
    // アプリケーション終了時/stopコマンドを実行 (実行から10秒のタイムアウトでプロセスキル)
    async (process) => {
      await process.write('stop');
      await process;
    },
    10000
  );

  async function run() {
    // サーバー開始を通知
    onStart();

    // サーバー終了まで待機
    const result = await process;

    // サーバー終了を通知
    onFinish();

    return result;
  }

  const result = decoratePromise(run(), {
    runCommand: process.write,
    kill: process.kill,
  });

  return result;
}
