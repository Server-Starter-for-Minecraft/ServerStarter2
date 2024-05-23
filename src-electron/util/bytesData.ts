import { createHash } from 'crypto';
import fetch from 'electron-fetch';
import { promises } from 'fs';
import sharp from 'sharp';
import { ImageURI } from '../schema/brands';
import { errorMessage } from './error/construct';
import { fromRuntimeError, isError, isValid } from './error/error';
import { Failable } from './error/failable';
import { Path } from './path';
import { Png } from './png';
import { utilLoggers } from './utilLogger';

const prismarineNbt = require('prismarine-nbt');
const loggers = utilLoggers.BytesData;

export type Hash = {
  type: 'sha1' | 'md5' | 'sha256';
  value: string;
};

/** BlobやFile等のBytesデータのクラス */
export class BytesData {
  data: ArrayBuffer;
  private constructor(data: ArrayBuffer) {
    this.data = data;
  }

  /** URLからデータを取得. ステータスコードが200でない場合はすべてエラーとみなす */
  static async fromURL(
    url: string,
    hash: Hash | undefined = undefined,
    headers?: { [key in string]: string }
  ): Promise<Failable<BytesData>> {
    const logger = loggers.fromURL({ url, hash });
    logger.start();

    try {
      const res = await fetch(url, { headers });
      if (res.status !== 200) {
        logger.fail({ status: res.status, statusText: res.statusText });
        return errorMessage.data.url.fetch({
          url: url,
          status: res.status,
          statusText: res.statusText,
        });
      }
      const buffer = await res.arrayBuffer();
      const result = new BytesData(buffer);

      if (hash === undefined) {
        logger.success();
        return result;
      }
      const calcHash = await result.hash(hash.type);
      if (hash.value === calcHash) {
        logger.success();
        return result;
      }

      const msg = `hash value missmatch expected: ${hash} calculated: ${calcHash}`;
      logger.fail(`${msg}`);
      return errorMessage.data.hashNotMatch({
        hashtype: hash.type,
        type: 'url',
        path: url,
      });
    } catch (e) {
      const em = fromRuntimeError(e);
      logger.fail(em);
      return fromRuntimeError(e);
    }
  }

  static async fromPath(
    path: Path,
    hash: Hash | undefined = undefined
  ): Promise<Failable<BytesData>> {
    const logger = loggers.fromPath({ path: path.str(), hash });
    logger.start();

    try {
      const buffer = await promises.readFile(path.str());
      const data = new BytesData(buffer);
      if (hash === undefined) {
        logger.success();
        return data;
      }

      const calcHash = await data.hash(hash.type);
      if (hash.value === calcHash) {
        logger.success();
        return data;
      }
      const msg = `hash value unmatch expected: ${hash} calculated: ${calcHash}`;
      logger.fail(msg);
      return errorMessage.data.hashNotMatch({
        hashtype: hash.type,
        type: 'file',
        path: path.str(),
      });
    } catch (e) {
      logger.fail();
      // TODO:黒魔術の解消
      return fromRuntimeError(e);
    }
  }

  /** utf-8の形式でByteDataに変換 */
  static async fromText(text: string): Promise<Failable<BytesData>> {
    return new BytesData(new TextEncoder().encode(text));
  }

  /** base64の形式でByteDataに変換 */
  static async fromBase64(base64: string): Promise<Failable<BytesData>> {
    return new BytesData(Buffer.from(base64, 'base64'));
  }

  /** base64の形式でByteDataに変換 */
  static async fromBuffer(buffer: ArrayBuffer): Promise<Failable<BytesData>> {
    return new BytesData(buffer);
  }

  /**
   * TODO: ファイルに出力
   */
  async write(path: string, executable?: boolean) {
    const logger = loggers.write({ path });
    logger.start();
    // 実行権限を与えて保存
    const settings = executable ? { mode: 0o755 } : undefined;
    try {
      await promises.writeFile(path, Buffer.from(this.data), settings);
      logger.success();
    } catch (e) {
      logger.fail(e);
    }
  }

  /**
   * 非推奨
   *
   * fromPathOrUrl/fromUrlOrPathを使用すること
   *
   * @param path
   * @param url
   * @param hash undefined データの整合性チェックのためのsha1ハッシュ値
   * @param prioritizeUrl true Urlにアクセスできなかった場合のみローカルのデータを参照する
   * @param updateLocal true Urlにアクセス出来た場合ローカルのデータを更新する
   * @param compareHashOnFetch true URLアクセス時にhash値を比較するかどうか
   * @returns
   */

  static async fromPathOrUrl(
    path: Path,
    url: string,
    hash: Hash | undefined = undefined,
    compareHashOnFetch = true,
    headers?: { [key in string]: string },
    executable?: boolean
  ): Promise<Failable<BytesData>> {
    const remoteHash = compareHashOnFetch ? hash : undefined;
    let data = await BytesData.fromPath(path, hash);
    if (isValid(data)) {
      return data;
    }

    data = await BytesData.fromURL(url, remoteHash, headers);
    if (isError(data)) {
      return data;
    }

    await path.parent().mkdir(true);
    await data.write(path.str(), executable);
    return data;
  }

  static async fromUrlOrPath(
    path: Path,
    url: string,
    hash: Hash | undefined = undefined,
    compareHashOnFetch = true,
    headers?: { [key in string]: string },
    executable?: boolean
  ): Promise<Failable<BytesData>> {
    const remoteHash = compareHashOnFetch ? hash : undefined;
    const data = await BytesData.fromURL(url, remoteHash, headers);
    if (isValid(data)) {
      await path.parent().mkdir(true);
      await data.write(path.str(), executable);
      return data;
    }
    const result = await BytesData.fromPath(path, hash);
    return result;
  }

  /** data:{mimetype};base64,... の形式でデコード
   *
   * mimetypeの例 "image/png"
   */
  static async fromBase64URI(uri: string): Promise<Failable<BytesData>> {
    const regex =
      /^data:[0-9A-Za-z!#$%&'*+\.^_`|~/-]+;base64,([A-Za-z0-9+/]+=*)$/;
    const match = uri.match(regex);

    if (match === null) return errorMessage.value.base64URI({ value: uri });

    return this.fromBase64(match[1]);
  }

  // /** objectをJavaNBTの形でエンコード */
  // static async fromNbtData(
  //   data: object,
  //   compression?: 'deflate' | 'deflate-raw' | 'gzip' | null
  // ): Promise<Failable<BytesData>> {
  //   try {
  //     const result = await (
  //       await nbt
  //     ).write(data, {
  //       endian: 'big',
  //       compression: compression,
  //     });
  //     return new BytesData(result.buffer);
  //   } catch (e) {
  //     return fromRuntimeError(e);
  //   }
  // }

  async hash(algorithm: 'sha1' | 'sha256' | 'md5') {
    const sha1 = createHash(algorithm);
    sha1.update(Buffer.from(this.data));
    return sha1.digest('hex');
  }

  async text(encoding = 'utf-8'): Promise<string> {
    return await new Promise((resolve) => {
      const text = new TextDecoder(encoding).decode(this.data);
      resolve(text);
    });
  }

  async json<T>(encoding = 'utf-8'): Promise<Failable<T>> {
    try {
      return await new Promise((resolve) => {
        const text = new TextDecoder(encoding).decode(this.data);
        resolve(JSON.parse(text));
      });
    } catch (e) {
      return fromRuntimeError(e);
    }
  }

  async png(): Promise<Failable<Png>> {
    try {
      return new Png(sharp(this.data));
    } catch (e) {
      return fromRuntimeError(e);
    }
  }

  /** バイト列をjava NBTに変換 */
  async nbt<T extends object>(): Promise<Failable<T>> {
    try {
      const nbt = await prismarineNbt;
      const result = await nbt.parse(Buffer.from(this.data), 'big');
      return nbt.simplify(result.parsed);
    } catch (e) {
      return fromRuntimeError(e);
    }
  }

  /** data:{mimetype};base64,... の形式でエンコード
   *
   * mimetypeの例 "image/png"
   */
  async encodeURI(mimetype: string): Promise<ImageURI> {
    // ArrayBufferからbase64に変換
    const base64uri = Buffer.from(this.data).toString('base64');

    return `data:${mimetype};base64,${base64uri}` as ImageURI;
  }
}
