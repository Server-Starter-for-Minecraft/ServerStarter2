import * as stream from 'stream';
import { Result } from '../base';
import { Readable, StreamKind, Writable, WritableStreamer } from './stream';
import { asyncPipe } from './util';

/** 何もせずにストリームを消費 */
export class DrainStream extends stream.Writable {
  constructor(objectMode: boolean) {
    super({ objectMode });
  }
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null | undefined) => void
  ): void {
    callback();
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    callback();
  }
}

export class Drain<K extends StreamKind> extends WritableStreamer<K, void> {
  private objectMode: boolean;
  constructor(objectMode: K extends StreamKind.ENTRY ? true : false) {
    super();
    this.objectMode = objectMode;
  }
  async write(readable: Readable<K>): Promise<Result<void, Error>> {
    return await asyncPipe(
      readable,
      new Writable(new DrainStream(this.objectMode))
    );
  }
}
