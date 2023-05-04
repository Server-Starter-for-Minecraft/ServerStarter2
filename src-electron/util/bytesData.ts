import { createHash } from 'crypto';
import { promises } from 'fs';
import { utilLoggers } from './logger';
import { Path } from './path';
import { isSuccess, Failable, isFailure } from '../api/failable';

const fetch = import('node-fetch');

export class BytesDataError extends Error {}

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

  static async fromURL(
    url: string,
    hash: Hash | undefined = undefined,
    headers?: { [key in string]: string }
  ): Promise<Failable<BytesData>> {
    const logger = loggers.fromURL({ url, hash });
    logger.start();

    try {
      const res = await (await fetch).default(url, { headers });
      if (!res.ok) {
        logger.fail({ status: res.status, statusText: res.statusText });
        return new BytesDataError(
          `failed to fetch ${url} status: ${res.status} ${res.statusText}`
        );
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
      return new BytesDataError(msg);
    } catch (e) {
      logger.fail();
      return e as Error;
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
      return new BytesDataError(msg);
    } catch (e) {
      logger.fail();
      // TODO:黒魔術の解消
      return e as unknown as Error;
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
    if (isSuccess(data)) {
      return data;
    }

    data = await BytesData.fromURL(url, remoteHash, headers);
    if (isFailure(data)) {
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
    if (isSuccess(data)) {
      await path.parent().mkdir(true);
      await data.write(path.str(), executable);
      return data;
    }
    const result = await BytesData.fromPath(path, hash);
    return result;
  }

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
      // TODO: 黒魔術の解消
      return e as unknown as Error;
    }
  }

  /** data:{mimetype};base64,... の形式でエンコード
   *
   * mimetypeの例 "image/png"
   */
  async encodeURI(mimetype: string) {
    // ArrayBufferからbase64に変換
    const base64uri = Buffer.from(this.data).toString('base64');

    return `data:${mimetype};base64,${base64uri}`;
  }
}
