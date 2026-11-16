import { createHash } from 'crypto';
import { ImageURI } from 'app/src-electron/schema/brands';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { safeExec } from 'app/src-electron/util/error/failable';
import { sourceLoggers } from '../sourceLogger';
import {
  distributionPath,
  type OuterResourceContext,
  type OuterResourceDefinition,
  type OuterResourceFetcher,
} from './definition';

const loggers = () => sourceLoggers().outerResource;

/** 外部リソースの取得先・保存先の設定 */
export type OuterResourceOptions = {
  /** 配布元の URL（この下の `v{schemaVersion}/{fileName}` を取得する） */
  baseUrl: string;
  /** 取得した配布ファイル・付属ファイルのキャッシュを保存するディレクトリ */
  cacheDir: Path;
  /** URL からデータを取得する関数（既定は `BytesData.fromURL`） */
  fetcher?: OuterResourceFetcher;
};

/** data URI として受け付ける画像の形式 */
const IMAGE_DATA_URI_REGEX =
  /^data:image\/(png|webp|svg\+xml|jpeg);base64,[A-Za-z0-9+/]+=*$/;

/** URL から読み込む画像の拡張子と MIME タイプの対応 */
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * 外部リソースを読み込み，保持する
 *
 * - 起動直後は同梱の内容かキャッシュを使い（ネットワークを待たない），`refresh()` で配布元の最新の内容に更新する
 * - 配布元から取得した内容は検証に合格した場合のみキャッシュに保存するため，
 *   配布元に誤った内容が公開されてもキャッシュや表示中の内容は壊れない
 */
export class OuterResource<W, R> {
  private readonly def: OuterResourceDefinition<W, R>;
  private readonly baseUrl: string;
  private readonly cacheDir: Path;
  private readonly fetcher: OuterResourceFetcher;
  private value: R | undefined;
  private loading: Promise<R> | undefined;

  constructor(
    def: OuterResourceDefinition<W, R>,
    options: OuterResourceOptions
  ) {
    this.def = def;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.cacheDir = options.cacheDir;
    this.fetcher = options.fetcher ?? ((url) => BytesData.fromURL(url));
  }

  /** 配布ファイルの URL */
  get fileUrl() {
    return `${this.baseUrl}/${distributionPath(this.def)}`;
  }

  /** 配布ファイルのキャッシュの保存先 */
  private get cacheFile() {
    return this.cacheDir.child(distributionPath(this.def));
  }

  /**
   * 現在の内容を返す
   *
   * 未読み込みの場合は，キャッシュ（なければ同梱の内容）を読み込んで返す。ネットワークにはアクセスしない
   */
  async get(): Promise<R> {
    if (this.value !== undefined) return this.value;
    this.loading ??= this.loadLocal();
    return this.loading;
  }

  /** 読み込み済みの内容を返す（まだ読み込んでいない場合は `undefined`） */
  current(): R | undefined {
    return this.value;
  }

  /**
   * 配布元から最新の内容を取得して更新する
   *
   * @returns 更新後の内容（取得・検証に失敗した場合はエラーを返し，現在の内容を維持する）
   */
  async refresh(): Promise<Failable<R>> {
    const logger = loggers().refresh({ key: this.def.key });
    // ローカルの読み込みが後から完了して，取得した内容を上書きしないよう先に済ませる
    await this.get();

    const data = await this.fetcher(this.fileUrl);
    if (isError(data)) {
      logger.warn(data);
      return data;
    }
    const wire = await data.json(this.def.parser);
    if (isError(wire)) {
      logger.warn(wire);
      return wire;
    }

    // 検証に合格した配布ファイルをそのまま保存する（不正な要素は読み込み時に除く）
    // （読み込み後の内容を保存すると，同じスキーマのバージョンでアプリを更新した際に，新しい項目が失われるため）
    // キャッシュに保存できなくても，取得した内容は使う
    const writeRes = await this.cacheFile.write(data);
    if (isError(writeRes)) logger.warn(writeRes);

    this.value = await this.def.resolve(wire, this.context());
    logger.info('updated');
    return this.value;
  }

  /** キャッシュ（なければ同梱の内容）を読み込む */
  private async loadLocal(): Promise<R> {
    let wire = this.def.bundled;
    if (this.cacheFile.exists()) {
      const cached = await this.cacheFile.readJson(this.def.parser);
      if (isValid(cached)) wire = cached;
      else loggers().loadLocal({ key: this.def.key }).warn(cached);
    }

    this.value = await this.def.resolve(wire, this.context());
    return this.value;
  }

  private context(): OuterResourceContext {
    return {
      loadImage: (source) => this.loadImage(source),
      warn: (message, detail) =>
        loggers()
          .resolve({ key: this.def.key, ...detail })
          .warn(message),
    };
  }

  /**
   * 画像を読み込み，data URI にして返す
   *
   * URL の画像は一度取得したらキャッシュから読み込む（画像を差し替える場合はファイル名を変える）
   */
  private async loadImage(source: string): Promise<Failable<ImageURI>> {
    if (source.startsWith('data:')) {
      return IMAGE_DATA_URI_REGEX.test(source)
        ? (source as ImageURI)
        : errorMessage.value.base64URI({ value: source });
    }

    const url = safeExec(() => new URL(source, this.fileUrl));
    if (isError(url)) return url;
    const fileUrl = safeExec(() => new URL(this.fileUrl));
    if (isError(fileUrl)) return fileUrl;

    // 配布元と同じ場所（相対パス）か https の URL のみ許可する
    const isSameOrigin = url.origin === fileUrl.origin;
    if (!isSameOrigin && url.protocol !== 'https:') {
      return errorMessage.data.url.unsupported({ url: url.href });
    }

    const ext = url.pathname.slice(url.pathname.lastIndexOf('.')).toLowerCase();
    const mimeType = IMAGE_MIME_TYPES[ext];
    if (mimeType === undefined) {
      return errorMessage.data.path.invalidExt({
        path: url.href,
        expectedExt: Object.keys(IMAGE_MIME_TYPES).join(', '),
      });
    }

    // 参照先ごとに異なるファイル名でキャッシュする
    // （配布元の URL を差し替えても同じ画像をキャッシュから読めるよう，解決前の参照先で区別する）
    const hash = createHash('sha1').update(source).digest('hex');
    const cachePath = this.cacheDir.child('assets', `${hash}${ext}`);
    if (cachePath.exists()) {
      const cached = await cachePath.read();
      if (isValid(cached)) return cached.encodeURI(mimeType);
    }

    const data = await this.fetcher(url.href);
    if (isError(data)) return data;
    const writeRes = await cachePath.write(data);
    if (isError(writeRes))
      loggers().loadImage({ url: url.href }).warn(writeRes);
    return data.encodeURI(mimeType);
  }
}
