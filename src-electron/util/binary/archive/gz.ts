// GZIP圧縮に関するutil
import * as zlib from 'zlib';
import { Failable } from '../../../schema/error';
import { isError } from '../../error/error';
import { BytesData } from '../bytesData';
import { Path } from '../path';

export class gzip {
  // ファイルからgzipを生成
  static async fromFile(path: Path): Promise<Failable<BytesData>> {
    const content = await path.read();
    if (isError(content)) return content;

    return new Promise<Failable<BytesData>>((resolve, reject) => {
      zlib.gzip(content.data, (err, binary) => {
        if (err !== null) reject(err);
        resolve(BytesData.fromBuffer(binary));
      });
    });
  }

  // BytesDataからgzipを生成
  static async fromData(content: BytesData): Promise<Failable<BytesData>> {
    return new Promise<Failable<BytesData>>((resolve, reject) => {
      zlib.gzip(content.data, (err, binary) => {
        if (err !== null) reject(err);
        resolve(BytesData.fromBuffer(binary));
      });
    });
  }
}
