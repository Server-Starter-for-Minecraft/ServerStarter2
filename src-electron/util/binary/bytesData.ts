import { createHash } from 'crypto';
import fetch from 'electron-fetch';
import { promises } from 'fs';
import sharp from 'sharp';
import { ImageURI } from 'app/src-electron/schema/brands';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from '../error/construct';
import { fromRuntimeError } from '../error/error';
import { Failable } from '../error/failable';
import { utilLoggers } from '../utilLogger';
import { Path } from './path';
import { Png } from './png';

const prismarineNbt = require('prismarine-nbt');
const loggers = () => utilLoggers().BytesData;

export type Hash = {
  type: 'sha1' | 'md5' | 'sha256';
  value: string;
};

/** BlobやFile等のBytesデータのクラス */
export class BytesData {
  data: Buffer;
  private constructor(data: Buffer) {
    this.data = data;
  }

  /** URLからデータを取得. ステータスコードが200でない場合はすべてエラーとみなす */
  static async fromURL(
    url: string,
    hash: Hash | undefined = undefined,
    headers?: { [key in string]: string }
  ): Promise<Failable<BytesData>> {
    const logger = loggers().fromURL({ url, hash });
    logger.trace('start');

    try {
      const res = await fetch(url, { headers });
      if (res.status !== 200) {
        logger.error({ status: res.status, statusText: res.statusText });
        return errorMessage.data.url.fetch({
          url: url,
          status: res.status,
          statusText: res.statusText,
        });
      }
      const buffer = await res.arrayBuffer();
      const result = new BytesData(Buffer.from(buffer));

      if (hash === undefined) {
        logger.trace('success');
        return result;
      }
      const calcHash = await result.hash(hash.type);
      if (hash.value === calcHash) {
        logger.trace('success');
        return result;
      }

      const msg = `hash value missmatch expected: ${hash} calculated: ${calcHash}`;
      logger.error(msg);
      return errorMessage.data.hashNotMatch({
        hashtype: hash.type,
        type: 'url',
        path: url,
      });
    } catch (e) {
      const em = fromRuntimeError(e);
      logger.error(em);
      return fromRuntimeError(e);
    }
  }

  static async fromPath(
    path: Path,
    hash: Hash | undefined = undefined
  ): Promise<Failable<BytesData>> {
    const logger = loggers().fromPath({
      path: path.path,
      hash,
    });
    logger.trace('start');

    try {
      const buffer = await promises.readFile(path.path);
      const data = new BytesData(buffer);
      if (hash === undefined) {
        logger.trace('success');
        return data;
      }

      const calcHash = await data.hash(hash.type);
      if (hash.value === calcHash) {
        logger.trace('success');
        return data;
      }
      const msg = `hash value unmatch expected: ${hash} calculated: ${calcHash}`;
      logger.error(msg);
      return errorMessage.data.hashNotMatch({
        hashtype: hash.type,
        type: 'file',
        path: path.path,
      });
    } catch (e) {
      const em = fromRuntimeError(e);
      logger.error(em);
      // TODO:黒魔術の解消
      return fromRuntimeError(e);
    }
  }

  /** utf-8の形式でByteDataに変換 */
  static async fromText(text: string): Promise<Failable<BytesData>> {
    return new BytesData(Buffer.from(new TextEncoder().encode(text)));
  }

  /** base64の形式でByteDataに変換 */
  static async fromBase64(base64: string): Promise<Failable<BytesData>> {
    return new BytesData(Buffer.from(base64, 'base64'));
  }

  /** base64の形式でByteDataに変換 */
  static async fromBuffer(buffer: Buffer): Promise<Failable<BytesData>> {
    return new BytesData(buffer);
  }

  /**
   * TODO: ファイルに出力
   */
  async write(
    path: string,
    executable?: boolean,
    encoding?: BufferEncoding
  ): Promise<Failable<void>> {
    const logger = loggers().write({ path });
    logger.info('start');
    const settings: { encoding?: BufferEncoding; mode?: number } = {};
    // 実行権限を与えて保存
    if (executable) {
      settings.mode = 0o755;
    }
    if (encoding) {
      settings.encoding = encoding;
    }
    try {
      await promises.writeFile(path, new Uint8Array(this.data), settings);
      logger.info('success');
    } catch (e) {
      const em = fromRuntimeError(e);
      logger.error(em);
      return errorMessage.data.path.creationFailed({
        type: 'file',
        path: path,
      });
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
    await data.write(path.path, executable);
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
      await data.write(path.path, executable);
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
    sha1.update(Uint8Array.from(this.data));
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
      const result = await nbt.parse(this.data, 'big');
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
    // Bufferからbase64に変換
    const base64uri = this.data.toString('base64');
    return `data:${mimetype};base64,${base64uri}` as ImageURI;
  }

  arrayBuffer() {
    const arrayBuffer = new ArrayBuffer(this.data.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < this.data.length; ++i) {
      view[i] = this.data[i];
    }
    return arrayBuffer;
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('BytesData', async () => {
    const { Path } = await import('./path');
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();
    // テストファイルのパス
    const testPath = new Path(__dirname).child('archive', 'test', 'sample.txt');

    // url(API) mock
    const url = 'https://jsonplaceholder.typicode.com/todos/1';
    const returnObj = {
      userId: 1,
      id: 1,
      title: 'delectus aut autem',
      completed: false,
    };

    test('from', async () => {
      // テキスト
      const text = 'test';
      const data = await BytesData.fromText(text);
      expect(isError(data)).toBe(false);
      if (isError(data)) return;
      await expect(data.text()).resolves.toBe(text);

      // Base64
      const base64 = 'dGVzdA==';
      const data2 = await BytesData.fromBase64(base64);
      expect(isError(data2)).toBe(false);
      if (isError(data2)) return;
      await expect(data2.text()).resolves.toBe(text);

      // Base64(Png)
      const base64uri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARElEQVR4nGNI9rT5jw3vZRAG0wz4JFEUfNgwAYxBkiAaRQG6JAyDFcAkkCVjwv////XrF5iNUwEIgBWgG4uOwSbgUwAA9rumUIV0HXQAAAAASUVORK5CYII=';
      const data4 = await BytesData.fromBase64URI(base64uri);
      expect(isError(data4)).toBe(false);
      if (isError(data4)) return;
      expect(isError(await data4.png())).toBe(false);
      expect(
        isError(await data4.write(workPath.child('sample.png').path))
      ).toBe(false);
      await expect(data4.encodeURI('image/png')).resolves.toBe(base64uri);

      // URL
      const data3 = await BytesData.fromURL(url);
      expect(isError(data3)).toBe(false);
      if (isError(data3)) return;
      await expect(data3.json()).resolves.toMatchObject(returnObj);
    });

    test('fromPathOrUrl', async () => {
      const invalidPath = workPath.child('invalid.txt');
      const invalidPath2 = workPath.child('invalid2.txt');

      // Pathがある場合はURLよりもPathが優先される
      const data = await BytesData.fromPathOrUrl(testPath, url);
      expect(isError(data)).toBe(false);
      if (isError(data)) return;
      await expect(data.text()).resolves.toBe('Hello World!');

      // Pathがない場合はPathよりもURLが優先され，PathにURLの内容が書き込まれる
      const data2 = await BytesData.fromPathOrUrl(invalidPath, url);
      expect(isError(data2)).toBe(false);
      if (isError(data2)) return;
      await expect(data2.json()).resolves.toMatchObject(returnObj);
      await expect(invalidPath.readJson()).resolves.toMatchObject(returnObj);

      // URLから優先して情報を取得し，ない場合はPathから取得する
      const data3 = await BytesData.fromUrlOrPath(invalidPath2, url);
      expect(isError(data3)).toBe(false);
      if (isError(data3)) return;
      await expect(data3.json()).resolves.toMatchObject(returnObj);
      await expect(invalidPath2.readJson()).resolves.toMatchObject(returnObj);

      // URLが無効な場合はPathから取得する
      const data4 = await BytesData.fromUrlOrPath(testPath, 'invalid.url.com');
      expect(isError(data4)).toBe(false);
      if (isError(data4)) return;
      await expect(data4.text()).resolves.toBe('Hello World!');
    });

    test(
      'hash',
      async () => {
        const text = 'test';
        const data = await BytesData.fromText(text);
        expect(isError(data)).toBe(false);
        if (isError(data)) return;
        await expect(data.hash('sha256')).resolves.toBe(
          '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
        );

        // server.jar (vanilla 1.21.4)
        const jarUrl =
          'https://piston-data.mojang.com/v1/objects/4707d00eb834b446575d89a61a11b5d548d8c001/server.jar';
        const jarHash = '4707d00eb834b446575d89a61a11b5d548d8c001';

        const bytes = await BytesData.fromURL(jarUrl);
        expect(isError(bytes)).toBe(false);
        if (isError(bytes)) return;

        await expect(bytes.hash('sha1')).resolves.toBe(jarHash);
      },
      60 * 1000
    );
  });
}
