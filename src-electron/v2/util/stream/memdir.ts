// メモリ上の仮想ディレクトリ
import stream from 'stream';
import { ok, Result } from '../base';
import { Bytes } from './bytes';
import {
  EntryData,
  Readable,
  ReadableStreamer,
  StreamKind,
  Writable,
} from './stream';
import { asyncPipe } from './util';

class MemDirRedable extends stream.Readable {
  data: { header: Record<string, any>; data: Bytes }[];
  constructor(data: { header: Record<string, any>; data: Bytes }[]) {
    super({ objectMode: true });
    this.data = data;
  }

  _read(size: number): void {
    const shift = this.data.shift();

    if (shift === undefined) {
      this.push(null);
      return;
    }
    const { data, header } = shift;

    const entryData: EntryData = {
      header: header,
      next: () => {},
      stream: data.createReadableStream(),
    };

    this.push(entryData);
  }

  _destroy(
    error: Error | null,
    callback: (error?: Error | null | undefined) => void
  ): void {}
}

class MemDirWritable extends stream.Writable {
  data: { header: Record<string, any>; data: Bytes }[];
  constructor(data: { header: Record<string, any>; data: Bytes }[]) {
    super({ objectMode: true });
    this.data = data;
  }

  async _write(
    chunk: EntryData,
    encoding: BufferEncoding,
    callback: (error?: Error | null | undefined) => void
  ) {
    const data = await new Readable<StreamKind.BIN>(chunk.stream.resume()).into(
      Bytes
    );

    this.data.push({ header: chunk.header, data: data.value() });

    chunk.next();
    callback();
  }
}

export class MemDir extends ReadableStreamer<StreamKind.ENTRY> {
  data: { header: Record<string, any>; data: Bytes }[];

  constructor(data: { header: Record<string, any>; data: Bytes }[]) {
    super();
    this.data = data;
  }

  static async write(
    readable: Readable<StreamKind.ENTRY>
  ): Promise<Result<MemDir, Error>> {
    const data: { header: Record<string, any>; data: Bytes }[] = [];
    const ws = new Writable<StreamKind.ENTRY>(new MemDirWritable(data));
    await asyncPipe(readable, ws);
    return ok(new MemDir(data));
  }

  createReadStream(): Readable<StreamKind.ENTRY> {
    return new Readable(new MemDirRedable([...this.data]));
  }
}
