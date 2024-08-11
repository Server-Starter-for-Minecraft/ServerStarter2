import * as stream from 'stream';
import { Err, err, ok, Result } from '../base';

/**
 * ReadableとWritableをエラーハンドル含めてpipeして待機
 * @param readable
 * @param writable
 * @returns
 */
export async function asyncPipe(
  readable: stream.Readable,
  writable: stream.Writable
) {
  readable.on('error', (error) => writable.destroy(error));
  let e: Err<Error> | undefined = undefined;
  readable.pipe(writable).on('error', (error) => {
    readable.destroy();
    e = err(error);
  });

  return new Promise<Result<undefined, Error>>((resolve) => {
    writable.on('close', () => {
      if (e !== undefined) return resolve(e);
      resolve(ok(undefined));
    });
  });
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('asyncPipe', () => {
    // TODO: asyncPipeのテスト 4 パターン書く
    // readable, writable 共に正常
    // readable で エラー
    // writable で エラー
    // readable と writable で エラー
  });
}

// /**
//  * 受け取った文字列をErrorでラップして流すだけの一瞬で終了するストリームを作成
//  *
//  * createReadStreamでエラーを作りたいときに使う
//  */
// export function createErrorStream(error: string): stream.Readable {
//   const readable = new stream.Readable({
//     read() {
//       readable.destroy(new Error(error));
//     },
//   });
//   return readable;
// }

// /**
//  * 受け取った文字列をErrorでラップして流すだけの一瞬で終了するストリームを作成
//  *
//  * createReadStreamでエラーを作りたいときに使う
//  */
// export function createErrorReadable(error: string): Readable {
//   stream.Readable;

//   const readable = new stream.Readable();
//   readable._read = () =>
//     // .readする前にストリームが終了するのを防ぐため
//     process.nextTick(() => {
//       readable.emit('error', new Error(error));
//       readable.push(null);
//     });
//   return new Readable(readable);
// }

// /** In Source Testing */
// if (import.meta.vitest) {
//   const { test, expect } = import.meta.vitest;
//   test('error stream', async () => {
//     const { Bytes } = await import('./bytes');
//     const es = createErrorReadable('ERROR');
//     expect((await es.into(Bytes)).error.message).toBe('ERROR');
//   });
// }
