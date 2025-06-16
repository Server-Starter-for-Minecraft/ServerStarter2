import { Failable } from 'app/src-electron/schema/error';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { interactiveProcess } from 'app/src-electron/util/binary/subprocess';
import { decoratePromise } from 'app/src-electron/util/promise/promiseDecorator';

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

  const stdout = (chunk: string) => splitLine(chunk, false, console);
  const stderr = (chunk: string) => splitLine(chunk, true, console);

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

function splitLine(
  chunk: string,
  isError: boolean,
  console: (value: string, isError: boolean) => void
) {
  // PR（#241）にて，改行を含むコンソール出力は分割してフロントエンドに送信していたが，
  // 同一の通信から受け取ったコンソールは意味のあるまとまりと考えて，この分割処理をせずに送信する仕様に戻した
  console(chunk, isError)
  // chunk.split(/\n|\r\n/).forEach((line) => {
  //   console(line, isError);
  // });
}
