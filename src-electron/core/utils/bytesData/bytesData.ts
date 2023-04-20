import { createHash } from 'crypto';
import { promises } from 'fs';
import { utilLoggers } from '../logger.js';
import { Path } from '../path/path.js';
import { isSuccess, Failable, isFailure } from '../../../api/failable.js';

const fetch = import('node-fetch');

export class BytesDataError extends Error {}

const loggers = utilLoggers.child('BytesData');

/** BlobやFile等のBytesデータのクラス */
export class BytesData {
  data: ArrayBuffer;
  private constructor(data: ArrayBuffer) {
    this.data = data;
  }

  static async fromURL(
    url: string,
    hash: string | undefined = undefined
  ): Promise<Failable<BytesData>> {
    const logger = loggers.operation('fromURL', { url, hash });
    logger.start();

    try {
      const res = await (await fetch).default(url);
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
      const calcHash = await result.sha1();
      if (hash === calcHash) {
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
    path: string,
    hash: string | undefined = undefined
  ): Promise<Failable<BytesData>> {
    const logger = loggers.operation('fromPath', { path, hash });
    logger.start();

    try {
      const buffer = await promises.readFile(path);
      const data = new BytesData(buffer);
      if (hash === undefined) {
        logger.success();
        return data;
      }
      const calcHash = await data.sha1();
      if (hash === calcHash) {
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

  // TODO:encodingの対応
  static async fromText(text: string): Promise<Failable<BytesData>> {
    return new BytesData(new TextEncoder().encode(text));
  }

  /**
   * TODO: ファイルに出力
   */
  async write(path: string) {
    const logger = loggers.operation('write', { path });
    logger.start();
    try {
      await promises.writeFile(path, Buffer.from(this.data));
      logger.success();
    } catch (e) {
      logger.fail(e);
    }
  }

  /**
   * @param path
   * @param url
   * @param hash データの整合性チェックのためのsha1ハッシュ値
   * @param prioritizeUrl Urlにアクセスできなかった場合のみローカルのデータを参照する
   * @param updateLocal Urlにアクセス出来た場合ローカルのデータを更新する
   * @param compareHashOnFetch URLアクセス時にhash値を比較するかどうか
   * @returns
   */

  static async fromPathOrUrl(
    path: string,
    url: string,
    hash: string | undefined = undefined,
    prioritizeUrl = true,
    updateLocal = true,
    compareHashOnFetch = true
  ): Promise<Failable<BytesData>> {
    const logger = loggers.operation('fromPathOrUrl', {
      path,
      url,
      hash,
      prioritizeUrl,
      updateLocal,
    });
    logger.start();
    const remoteHash = compareHashOnFetch ? hash : undefined;
    if (prioritizeUrl) {
      const data = await BytesData.fromURL(url, remoteHash);
      if (isSuccess(data)) {
        if (updateLocal) {
          await new Path(path).parent().mkdir(true);
          await data.write(path);
        }
        logger.success();
        return data;
      }
      const result = await BytesData.fromPath(path, hash);
      if (isSuccess(result)) {
        logger.fail();
      } else {
        logger.success();
      }
      return result;
    } else {
      let data = await BytesData.fromPath(path, hash);
      if (isSuccess(data)) {
        logger.success();
        return data;
      }

      data = await BytesData.fromURL(url, remoteHash);
      if (isFailure(data)) {
        logger.fail();
        return data;
      }

      if (updateLocal) {
        await new Path(path).parent().mkdir(true);
        await data.write(path);
      }
      logger.success();
      return data;
    }
  }

  async sha1() {
    const sha1 = createHash('sha1');
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
}
