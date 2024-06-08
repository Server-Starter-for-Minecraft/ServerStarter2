// メモリ上の仮想ディレクトリ
import { Result } from '../base';
import { DuplexStreamer, Readable, StreamKind } from './stream';

export class MdemDir extends DuplexStreamer<StreamKind.ENTRY, void> {
  write(readable: Readable<StreamKind.ENTRY>): Promise<Result<void, Error>> {
    throw new Error('Method not implemented.');
  }
  createReadStream(): Readable<StreamKind.ENTRY> {
    throw new Error('Method not implemented.');
  }
}

// TODO: 実装
