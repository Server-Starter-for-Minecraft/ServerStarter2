import { Path } from '../path';
import { DuplexStreamer } from '../stream';

export class Archive {
  readonly path: Path;
  constructor(path: Path) {
    this.path = path;
  }
  as(archiver: Archiver): DuplexStreamer<void> {
    return archiver.archive(this.path);
  }
}

export interface Archiver {
  archive(path: Path): DuplexStreamer<void>;
}

// const zip():Archiver{
// }

// new Archive(new Path('./test/dir'))
//   .as(tar())
//   .into(new Path('./test/tar.tgz'));

// new Path('./test/tar.tgz').into(new Archive(new Path('./test/dir')).as(tar()));
