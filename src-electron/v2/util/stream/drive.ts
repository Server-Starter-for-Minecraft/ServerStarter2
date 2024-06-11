import path from 'path';
import * as stream from 'stream';
import { err, ok, Result } from '../base';
import {
  DuplexStreamer,
  EntryData,
  EntryStats,
  Readable,
  StreamKind,
} from './stream';

export abstract class Drive {
  abstract file(): DuplexStreamer<StreamKind.BIN, void>;

  dir(): DuplexStreamer<StreamKind.ENTRY, void> {
    return new DriveEntryStreamer(this);
  }

  abstract getStat(): Promise<Result<EntryStats>>;
  abstract setStat(stats: EntryStats): Promise<Result<void>>;

  abstract child<T>(this: T, child: string): T;
  abstract parent<T>(this: T, times?: number): Result<T>;
  abstract existsAsync(): Promise<boolean>;
  abstract basename(): string;
  abstract stemname(): string;
  abstract extname(): string;
  abstract isDirectory(): Promise<Result<boolean>>;
  abstract isFile(): Promise<Result<boolean>>;
  /** ディレクトリを再帰的に作成 */
  abstract mkdir(): Promise<Result<void>>;
  abstract iter<T>(this: T): AsyncIterable<T>;
}

class DriveEntryStreamer extends DuplexStreamer<StreamKind.ENTRY, void> {
  private drive: Drive;
  constructor(drive: Drive) {
    super();
    this.drive = drive;
  }

  async write(
    readable: Readable<StreamKind.ENTRY>
  ): Promise<Result<void, Error>> {
    if (!(await this.drive.existsAsync())) {
      readable.stream.destroy();
      return err.error('ENTRY_ALREADY_EXISTS');
    }
    await this.drive.mkdir();
    readable.stream.on('data', async (entry: EntryData) => {
      const path = this.drive.child(entry.path);
      switch (entry.type) {
        case 'DIR':
          await path.mkdir();
          break;
        case 'FILE':
          await path.parent().value().mkdir();
          entry.readable.into(this.drive.child(entry.path).file());
          break;
      }
    });
    return ok();
  }

  createReadStream(): Readable<StreamKind.ENTRY> {
    async function* recursiveIter(
      drive: Drive,
      dirPath = ''
    ): AsyncGenerator<EntryData> {
      for await (const entry of drive.iter()) {
        const stats = await entry.getStat();
        if (stats.isErr) continue;

        if (await entry.isDirectory()) {
          yield { type: 'DIR', path: dirPath, stats: stats.value() };

          const basename = entry.basename();
          for await (const entry of recursiveIter(
            drive.child(basename),
            path.join(dirPath, basename)
          )) {
            yield entry;
          }
        } else if (await entry.isFile()) {
          yield {
            type: 'FILE',
            path: dirPath,
            stats: stats.value(),
            readable: entry.file().createReadStream(),
          };
        }
      }
    }

    stream.Readable.from(recursiveIter(this.drive));
    throw new Error('Method not implemented.');
  }
}
