import { Path } from '../path';
import { ReadableStreamer, WritableStreamer } from '../stream';

export interface Archiver<
  PackOPT extends Record<string, any>,
  ExtractOPT extends Record<string, any>
> {
  pack(path: Path, opt?: PackOPT): ReadableStreamer;
  extrect(path: Path, opt?: ExtractOPT): WritableStreamer<void>;
}

// declare const archiver: Archiver;

// archiver.pack(new Path('./test/dir')).into(new Path('./test/tar.tgz'));

// new Path('./test/tar.tgz').into(archiver.extrect(new Path('./test/dir')));
