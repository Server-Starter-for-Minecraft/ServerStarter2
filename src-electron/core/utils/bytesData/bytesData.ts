import { createHash } from 'crypto';
import { createReadStream, promises } from 'fs';
import fetch from 'node-fetch';
import { Path } from '../path/path.js';
import { isSuccess, Failable, isFailure } from '../result.js';

export class BytesDataError extends Error {}

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
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return new BytesDataError(
          `failed to fetch ${url} status: ${res.status} ${res.statusText}`
        );
      }
      const buffer = await res.arrayBuffer();
      const result = new BytesData(buffer);
      if (hash === undefined) return result;
      const calcHash = await result.sha1();
      if (hash === calcHash) return result;
      return new BytesDataError(
        `hash value unmatch expected: ${hash} calculated: ${calcHash}`
      );
    } catch (e) {
      return e as Error;
    }
  }

  static async fromPath(
    path: string,
    hash: string | undefined = undefined
  ): Promise<Failable<BytesData>> {
    try {
      const buffer = await promises.readFile(path);
      const data = new BytesData(buffer);
      if (hash === undefined) return data;
      const calcHash = await data.sha1();
      if (hash === calcHash) return data;
      console.log(`hash value unmatch expected: ${hash} calculated: ${calcHash}`);
      return new BytesDataError(
        `hash value unmatch expected: ${hash} calculated: ${calcHash}`
      );
    } catch (e) {
      // TODO:黒魔術の解消
      return e as unknown as Error;
    }
  }

  // TODO:encodingの対応
  static async fromText(
    text: string,
    encoding = 'utf-8'
  ): Promise<Failable<BytesData>> {
    return new BytesData(new TextEncoder().encode(text));
  }

  /**
   * TODO: ファイルに出力
   */
  async write(path: string) {
    await promises.writeFile(path, Buffer.from(this.data));
  }

  /**
   *
   * @param path
   * @param url
   * @param hash ローカル保存にのみ参照するデータの整合性チェックのためのsha1ハッシュ値
   * @param prioritizeUrl Urlにアクセスできなかった場合のみローカルのデータを参照する
   * @param updateLocal Urlにアクセス出来た場合ローカルのデータを更新する
   * @returns
   */
  static async fromPathOrUrl(
    path: string,
    url: string,
    hash: string | undefined = undefined,
    prioritizeUrl: boolean = true,
    updateLocal: boolean = true
  ): Promise<Failable<BytesData>> {
    if (prioritizeUrl) {
      const data = await BytesData.fromURL(url);
      if (isSuccess(data)) {
        if (updateLocal) {
          await new Path(path).parent().mkdir(true);
          await data.write(path);
        }
        return data;
      }
      return await BytesData.fromPath(path, hash);
    } else {
      let data = await BytesData.fromPath(path, hash);
      if (isSuccess(data)) return data;

      data = await BytesData.fromURL(url);
      if (isFailure(data)) return data;

      if (updateLocal) {
        await new Path(path).parent().mkdir(true);
        await data.write(path);
      }
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
