import { err, ok, Result } from '../base';
import { ReadableStreamer, WritableStreamer } from '../binary/stream';

/**
 * パスのデータの種類
 */
export enum PathEntryType {
  /** 何もない */
  NULL,
  /** ディレクトリ */
  DIR,
  /** ファイル */
  FILE,
}

abstract class BaseEnrty<R extends boolean, W extends boolean> {
  /** このエントリが存在するかを確認 */
  abstract exists(): Promise<boolean>;
  /** このエントリの種類を確認 */
  abstract entryType(): Promise<PathEntryType>;
  /** このエントリの子エントリ */
  abstract child(path: string): Enrty<R, W>;
}

export abstract class ReadableEnrty<W extends boolean> extends BaseEnrty<
  true,
  W
> {
  /** このエントリの子エントリを列挙 */
  abstract iter(): Promise<Result<Record<string, Enrty<true, W>>>>;

  /** このエントリを別のWritableEnrtyにコピー */
  async copyTo(writable: WritableEnrty<boolean>): Promise<Result<void>> {
    const entries = await this.iter();
    if (entries.isErr) return entries;

    if (await writable.exists()) return err.error('must be empty');

    switch (await this.entryType()) {
      case PathEntryType.FILE:
        await this.file.into(writable.writer());
        break;
      case PathEntryType.NULL:
        // なにもしない
        break;
      case PathEntryType.DIR:
        // ディレクトリを作成
        const mkdir = await writable.mkdir();
        if (mkdir.isErr) return mkdir;

        // 子要素を列挙
        const entries = await this.iter();
        if (entries.isErr) return entries;

        // 再帰的にコピー
        const promisses = Object.entries(entries.value()).map(([name, entry]) =>
          entry.copyTo(writable.child(name))
        );
        await Promise.all(promisses);
        break;
    }
    return ok();
  }

  abstract file: ReadableStreamer;
  abstract reader(): ReadableStreamer;
}

export abstract class WritableEnrty<R extends boolean> extends BaseEnrty<
  R,
  true
> {
  abstract remove(): Promise<Result<void>>;
  abstract mkdir(): Promise<Result<void>>;
  abstract writer(): WritableStreamer<void>;
}

export abstract class DuplexEnrty
  extends ReadableEnrty<true>
  implements WritableEnrty<true>
{
  abstract remove(): Promise<Result<void>>;
  abstract mkdir(): Promise<Result<void>>;
  abstract writer(): WritableStreamer<void>;
}

export type Enrty<R extends boolean, W extends boolean> = R extends true
  ? W extends true
    ? DuplexEnrty
    : ReadableEnrty<false>
  : W extends true
  ? WritableEnrty<false>
  : never;
