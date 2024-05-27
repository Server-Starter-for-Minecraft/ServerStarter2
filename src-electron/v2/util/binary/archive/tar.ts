import * as stream from 'stream';
import { ExtractOptions, PackOptions, extract, pack } from 'tar-fs';
import { Path } from '../path';
import { Result } from '../../base';
import { asyncPipe } from '../util';
import { Archiver } from './archive';
import { Readable, WritableStreamer } from '../stream';

class Tar extends WritableStreamer<void> {
  readonly pathObj: Path;
  readonly optsObj?: ExtractOptions;

  constructor(path: Path, opts?: ExtractOptions) {
    super();
    this.pathObj = path;
    this.optsObj = opts;
  }

  // 単一のTarをフォルダに展開
  write(readable: stream.Readable): Promise<Result<void, Error>> {
    return asyncPipe(readable, extract(this.pathObj.path, this.optsObj));
  }
}

export const tarArchiver: Archiver<PackOptions, ExtractOptions> = {
  pack(path, opts) {
    return new Readable(pack(path.path, opts));
  },
  extrect(path, opts) {
    return new Tar(path, opts);
  },
};


/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('tar',() => {
    // TODO: @MojaMonchi @nozz-mat Tarファイルの展開と圧縮が正しく行われることを確認
    // TODO: TarファイルにおけるOS間でHASH値が同じになるか調査
  })
}
