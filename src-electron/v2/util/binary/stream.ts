import { nextTick } from 'process';
import * as stream from 'stream';
import { Awaitable, Result } from '../base';
import { tick } from '../promise/tick';

export abstract class ReadableStreamer {
  /**
   * 読み込みストリームを生成する
   *
   * 基本的に into / convert から呼び出す目的
   */
  abstract createReadStream(): Readable;
  /**
   * ストリームを変換する
   *
   * e.g バイナリ から Base64 , ShiftJIS から utf8
   *
   * @param duplex ストリーム変換用オブジェクト 基本的にstream.Transform を想定
   */
  convert(duplex: stream.Duplex): Readable {
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
  into<T>(target: WritableStreamer<T>): Promise<Result<T, Error>> {
    return this.createReadStream().into(target);
  }
}

export abstract class WritableStreamer<T> {
  /**
   * ストリームから書き込む
   *
   * 基本的に IReadableStreamer.into から呼び出されることを想定
   *
   * @param target 書き込み先
   */
  abstract write(readable: stream.Readable): Promise<Result<T, Error>>;
}

export abstract class DuplexStreamer<T>
  extends ReadableStreamer
  implements WritableStreamer<T>
{
  abstract write(readable: stream.Readable): Promise<Result<T, Error>>;
}

export class Readable implements ReadableStreamer {
  readonly stream: Awaitable<stream.Readable>;
  constructor(stream: Awaitable<stream.Readable>) {
    this.stream = stream;
  }
  createReadStream(): Readable {
    return this;
  }
  private async pipe<T extends stream.Writable | stream.Duplex>(
    stream: Awaitable<T>
  ): Promise<T> {
    const [sec, tgt] = await Promise.all([this.stream, stream]);
    return sec.on('error', tgt.destroy).pipe(tgt) as T;
  }
  convert(duplex: stream.Duplex): Readable {
    return new Readable(this.pipe(duplex));
  }
  async into<T>(target: WritableStreamer<T>): Promise<Result<T, Error>> {
    const stream = await this.stream;
    stream.pause();
    await tick();
    stream.resume();
    return target.write(stream);
  }
}
