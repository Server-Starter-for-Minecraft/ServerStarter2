import { Bytes } from '../binary/bytes';
import { DuplexStreamer } from '../binary/stream';

class JsonFile<T> {
  target: DuplexStreamer<T>;
  encoding: BufferEncoding;

  constructor(target: DuplexStreamer<T>, encoding: BufferEncoding = 'utf8') {
    this.target = target;
    this.encoding = encoding;
  }

  /**
   * ファイルからJSONを読み込む
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  async read(): Promise<Result<string>> {
    const buf = await this.target.into(Bytes);
    if (buf.isErr()) return buf;
    const str = buf.value.toStr(this.encoding);
    if (str.isErr()) return buf;
    try {
      return ok(JSON.parse(buf.value));
    } catch (e) {
      return err(e as Error);
    }
  }

  /**
   * ファイルからJSONを読み込む
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  async write(
    content: string,
    encoding: BufferEncoding = 'utf8'
  ): Promise<Result<string>> {
    const txt = await this.readText(encoding);
    if (txt.isErr()) return txt;
    try {
      return ok(JSON.parse(txt.value));
    } catch (e) {
      return err(e as Error);
    }
  }
}
