import { Path } from '../path';
import { ReadableStreamer, WritableStreamer } from '../stream';

export interface Archiver {
  pack(path: Path): ReadableStreamer;
  extrect(path: Path): WritableStreamer<void>;
}

// declare const archiver: Archiver;

// archiver.pack(new Path('./test/dir')).into(new Path('./test/tar.tgz'));

// new Path('./test/tar.tgz').into(archiver.extrect(new Path('./test/dir')));
