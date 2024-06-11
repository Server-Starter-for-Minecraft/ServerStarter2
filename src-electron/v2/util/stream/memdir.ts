// メモリ上の仮想ディレクトリ
import stream from 'stream';
import { ok, Result } from '../base';
import { Bytes } from './bytes';
import {
  EntryData,
  EntryStats,
  Readable,
  ReadableStreamer,
  StreamKind,
  Writable,
} from './stream';
import { asyncPipe } from './util';

type MemDirEntry = { path: string; data?: Bytes; stats?: EntryStats };

class MemDirRedable extends stream.Readable {
  data: MemDirEntry[];
  constructor(data: MemDirEntry[]) {
    super({ objectMode: true });
    this.data = data;
  }

  _read(size: number): void {
    const shift = this.data.shift();
    if (shift === undefined) {
      this.push(null);
      return;
    }
    const { path, data, stats } = shift;

    let entryData: EntryData;
    if (data === undefined) {
      entryData = {
        type: 'DIR',
        path,
        stats,
      };
    } else {
      entryData = {
        type: 'FILE',
        path,
        stats,
        readable: data.createReadStream(),
      };
    }
    this.push(entryData);
  }

  _destroy(
    error: Error | null,
    callback: (error?: Error | null | undefined) => void
  ): void {
  }
}

class MemDirWritable extends stream.Writable {
  data: MemDirEntry[];

  constructor(data: MemDirEntry[]) {
    super({ objectMode: true });
    this.data = data;
  }

  async _write(
    entry: EntryData,
    encoding: BufferEncoding,
    callback: (error?: Error | null | undefined) => void
  ) {
    if (entry.type === 'DIR') {
      this.data.push({
        path: entry.path,
        stats: entry.stats,
      });
      callback();
    } else {
      entry.readable.stream.resume();
      const data = await entry.readable.into(Bytes);
      if (data.isErr) this.destroy(data.error());

      this.data.push({
        data: data.value(),
        path: entry.path,
        stats: entry.stats,
      });
      callback();
    }
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    callback();
  }
}

export class MemDir extends ReadableStreamer<StreamKind.ENTRY> {
  data: MemDirEntry[];

  constructor(data: MemDirEntry[]) {
    super();
    this.data = data;
  }

  static async write(
    readable: Readable<StreamKind.ENTRY>
  ): Promise<Result<MemDir, Error>> {
    const data: MemDirEntry[] = [];
    const ws = new Writable<StreamKind.ENTRY>(new MemDirWritable(data));
    return (await asyncPipe(readable, ws)).onOk(() => ok(new MemDir(data)));
  }

  createReadStream(): Readable<StreamKind.ENTRY> {
    return new Readable(new MemDirRedable([...this.data]));
  }
}
