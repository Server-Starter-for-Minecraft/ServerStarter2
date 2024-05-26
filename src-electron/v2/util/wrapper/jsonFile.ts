import type { z } from 'zod';
import { err, ok, Result } from '../base';
import { Bytes } from '../binary/bytes';
import { IReadableStreamer, IWritableStreamer } from '../binary/stream';

/**
 * JSONファイルを扱うクラス
 *
 * データのバリデーションも行う
 */
export class JsonFile<T extends IReadableStreamer | IWritableStreamer<any>, U> {
  private target: T;
  private encoding: BufferEncoding;
  private validator: z.ZodType<U>;
  private lock: undefined | Promise<any>;

  constructor(
    target: T,
    validator: z.ZodSchema<U>,
    encoding: BufferEncoding = 'utf8'
  ) {
    this.target = target;
    this.validator = validator;
    this.encoding = encoding;
    this.lock = undefined;
  }

  /**
   * ファイルからJSONを読み込む
   */
  async read(this: JsonFile<IReadableStreamer, U>): Promise<Result<U>> {
    // 読み書き処理中の場合待機
    await this.lock;

    // ロックして読み取り
    const promise = this.target.into(Bytes);
    this.lock = promise;
    const str = (await promise).flatMap((x) => x.toStr());
    this.lock = undefined;

    if (str.isErr()) return str;
    try {
      const value = JSON.parse(str.value);
      const parsed = await this.validator.safeParseAsync(value);
      if (parsed.success) return ok(parsed.data);
      return err(new Error('ZOD_PARSE_ERROR'));
    } catch (e) {
      return err(e as Error);
    }
  }

  /**
   * ファイにJSONを書き込む
   */
  async write<T>(
    this: JsonFile<IWritableStreamer<T>, U>,
    content: U
  ): Promise<Result<T>> {
    const str = JSON.stringify(content);

    // 読み書き処理中の場合待機
    await this.lock;

    // ロックして読み取り
    const promise = Bytes.fromString(str, this.encoding).into(this.target);
    this.lock = promise;
    const result = await promise;
    this.lock = undefined;

    return result;
  }
}
