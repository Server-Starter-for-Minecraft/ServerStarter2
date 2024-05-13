import * as stream from 'stream';
import { Result } from '../base';

export interface IReadableStreamer {
  createReadStream(): Readable;
  convert(duplex: stream.Duplex): Readable;
  into<T>(target: IWritableStreamer<T>): Promise<Result<T, Error>>;
}

export interface IWritableStreamer<T> {
  write(readable: stream.Readable): Promise<Result<T, Error>>;
}

export interface IDuplexStreamer<T>
  extends IReadableStreamer,
    IWritableStreamer<T> {}

export abstract class ReadableStreamer implements IReadableStreamer {
  abstract createReadStream(): Readable;
  convert(duplex: stream.Duplex): Readable {
    return this.createReadStream().convert(duplex);
  }
  into<T>(target: IWritableStreamer<T>): Promise<Result<T, Error>> {
    return this.createReadStream().into(target);
  }
}

export abstract class WritableStreamer<T> implements IWritableStreamer<T> {
  abstract write(readable: stream.Readable): Promise<Result<T, Error>>;
}

export abstract class DuplexStreamer<T> implements IDuplexStreamer<T> {
  abstract createReadStream(): Readable;
  convert(duplex: stream.Duplex): Readable {
    return this.createReadStream().convert(duplex);
  }
  into<T>(target: IWritableStreamer<T>): Promise<Result<T, Error>> {
    return this.createReadStream().into(target);
  }
  abstract write(readable: stream.Readable): Promise<Result<T, Error>>;
}

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
  into<T>(target: WritableStreamer<T>): Promise<Result<T, Error>> {
    return target.write(this.stream);
  }
}
