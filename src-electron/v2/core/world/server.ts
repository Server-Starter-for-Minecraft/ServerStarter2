import { Server } from '../../source/server/server';

/**
 * サーバーを起動してイベントの登録と解除を行う
 * @param server
 * @param param1
 */
export async function runServer(
  server: Server,
  {
    emitStdout,
    emitStderr,
  }: {
    emitStdout: (data: Buffer) => void;
    emitStderr: (data: Buffer) => void;
  }
) {
  // サーバーを起動
  await server.start();

  const process = server.process.value;

  // stdout イベント登録
  process.stdout.value.stream.on('data', emitStdout);
  // stderr イベント登録
  process.stderr.value.stream.on('data', emitStderr);

  // サーバーの終了を待機
  await process.promise();

  // stdout イベント解除
  process.stdout.value.stream.off('data', emitStdout);
  // stderr イベント解除
  process.stderr.value.stream.off('data', emitStderr);
}
