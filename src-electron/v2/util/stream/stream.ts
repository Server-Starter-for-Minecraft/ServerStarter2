import * as stream from 'stream';
import { Result } from '../base';

/** 何のストリームなのか */
export enum StreamKind {
  /** バイト列 */
  BIN,
  /** ファイルエントリ列 */
  ENTRY,
}

export abstract class ReadableStreamer<K extends StreamKind> {
  /**
   * 読み込みストリームを生成する
   *
   * 基本的に into / convert から呼び出す目的
   */
  abstract createReadStream(): Readable<K>;

  /**
   * ストリームを変換する
   *
   * e.g バイナリ から Base64 , ShiftJIS から utf8
   *
   * @param duplex ストリーム変換用オブジェクト 基本的にstream.Transform を想定
   */
  convert<L extends StreamKind>(duplex: Conversion<K, L>): Readable<L> {
    return this.createReadStream().convert(duplex);
  }

  /**
   * ストリームを書き込む
   *
   * 書き込み先によっては 意味のある戻り値<T>を返すことがある
   *
   * メモリ上 / URL / パス / ハッシュ値 等
   *
   * @param target 書き込み先
   */
  into<T>(target: WritableStreamer<K, T>): Promise<Result<T, Error>> {
    return this.createReadStream().into(target);
  }
}

export abstract class WritableStreamer<K extends StreamKind, T> {
  /**
   * ストリームから書き込む
   *
   * 基本的に IReadableStreamer.into から呼び出されることを想定
   *
   * @param target 書き込み先
   */
  abstract write(readable: Readable<K>): Promise<Result<T, Error>>;
}

export abstract class DuplexStreamer<K extends StreamKind, T>
  extends ReadableStreamer<K>
  implements WritableStreamer<K, T>
{
  abstract write(readable: Readable<K>): Promise<Result<T, Error>>;
}

export class Readable<K extends StreamKind> {
  readonly stream: stream.Readable;
  constructor(stream: stream.Readable) {
    this.stream = stream;
  }
  createReadStream(): Readable<K> {
    return this;
  }
  private pipe<T extends stream.Writable | stream.Duplex>(stream: T): T {
    return this.stream.on('error', stream.destroy).pipe(stream) as T;
  }
  convert<L extends StreamKind>(duplex: Conversion<K, L>): Readable<L> {
    return new Readable<K>(this.pipe(duplex.stream));
  }
  into<T>(target: WritableStreamer<K, T>): Promise<Result<T, Error>> {
    return target.write(this);
  }
}

export type EntryType =
  | 'file'
  | 'link'
  | 'symlink'
  | 'character-device'
  | 'block-device'
  | 'directory'
  | 'fifo'
  | 'contiguous-file'
  | 'pax-header'
  | 'pax-global-header'
  | 'gnu-long-link-path'
  | 'gnu-long-path'
  | null
  | undefined;

export type EntryHeader = {
  name: string;
  type?: EntryType;
  mode?: number;
  uid?: number;
  gid?: number;
  size?: number;
  mtime?: Date;
  other?: {
    tar?: {
      linkname?: null | string;
    };
    zip?: {
      compressionMethod: number;
    };
  };
};

export type EntryData = {
  header: EntryHeader; // TODO: any???
  stream: stream.Readable;
};

export class Writable<K extends StreamKind> {
  readonly stream: stream.Writable;
  constructor(stream: stream.Writable) {
    this.stream = stream;
  }
}

export class Conversion<K extends StreamKind, L extends StreamKind> {
  readonly stream: stream.Duplex;
  constructor(stream: stream.Duplex) {
    this.stream = stream;
  }
}
