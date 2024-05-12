import * as stream from 'stream';
import { Result } from '../base';

export type ReadableStreamer = {
  createReadStream(): Readable;
  convert(duplex: stream.Duplex): Readable;
  to<T>(target: WriteStreamer<T>): Promise<Result<T, Error>>;
};

export type WriteStreamer<T> = {
  write(readable: stream.Readable): Promise<Result<T, Error>>;
};

export type DuplexStreamer<T> = ReadableStreamer & WriteStreamer<T>;

export class Readable implements ReadableStreamer {
  readonly stream: stream.Readable;
  constructor(stream: stream.Readable) {
    this.stream = stream;
  }
  createReadStream(): Readable {
    return this;
  }
  private pipe<T extends stream.Writable | stream.Duplex>(stream: T): T {
    return this.stream.on('error', stream.destroy).pipe(stream) as T;
  }
  convert(duplex: stream.Duplex): Readable {
    return new Readable(this.pipe(duplex));
  }
  to<T>(target: WriteStreamer<T>): Promise<Result<T, Error>> {
    return target.write(this.stream);
  }
}
