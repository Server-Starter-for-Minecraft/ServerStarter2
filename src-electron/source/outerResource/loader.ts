import { ImageURI } from 'app/src-electron/schema/brands';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { asBrand } from 'app/src-electron/util/zod/brand';
import { sourceLoggers } from '../sourceLogger';
import {
  distributionPath,
  IMAGE_DATA_URI_REGEX,
  type OuterResourceContext,
  type OuterResourceDefinition,
  type OuterResourceFetcher,
  resolveImageSource,
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
    this.fetcher = options.fetcher ?? (async (url) => BytesData.fromURL(url));
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

    this.value = await this.def.resolve(wire, this.context(true));
    logger.info('updated');
    return this.value;
  }

  /** キャッシュ（なければ同梱の内容）を読み込む */
  private async loadLocal(): Promise<R> {
    let wire = this.def.bundled;
    if (await this.cacheFile.exists()) {
      const cached = await this.cacheFile.readJson(this.def.parser);
      if (isValid(cached)) wire = cached;
      else loggers().loadLocal({ key: this.def.key }).warn(cached);
    }

    // 起動を遅らせないよう，ローカルの読み込みでは画像も配布元から取得しない（取得は refresh で行う）
    this.value = await this.def.resolve(wire, this.context(false));
    return this.value;
  }

  /**
   * 解決処理に渡す機能を作る
   *
   * @param allowNetwork 画像を配布元から取得してよいか（`false` の場合はキャッシュにある画像のみ使う）
   */
  private context(allowNetwork: boolean): OuterResourceContext {
    return {
      loadImage: async (source) => this.loadImage(source, allowNetwork),
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
   *
   * @param source 配布ファイルからの相対パス・https の URL・画像の data URI のいずれか
   * @param allowNetwork キャッシュに無い画像を配布元から取得してよいか
   */
  private async loadImage(
    source: string,
    allowNetwork: boolean
  ): Promise<Failable<ImageURI>> {
    if (source.startsWith('data:')) {
      // 形式を確認したうえでブランド型を付ける（BytesData#encodeURI で作る data URI と同じ扱い）
      return IMAGE_DATA_URI_REGEX.test(source)
        ? asBrand(ImageURI, source)
        : errorMessage.value.base64URI({ value: source });
    }

    const resolved = resolveImageSource(source, this.fileUrl);
    if (isError(resolved)) return resolved;
    const { url, ext, mimeType } = resolved;

    // 参照先ごとに異なるファイル名でキャッシュする
    // （配布元の URL を差し替えても同じ画像をキャッシュから読めるよう，解決前の参照先で区別する）
    const sourceData = await BytesData.fromText(source);
    if (isError(sourceData)) return sourceData;
    const hash = await sourceData.hash('sha1');
    const cachePath = this.cacheDir.child('assets', `${hash}${ext}`);
    if (await cachePath.exists()) {
      const cached = await cachePath.read();
      if (isValid(cached)) return cached.encodeURI(mimeType);
      // 読み込めないキャッシュは，取得し直して上書きする
      loggers().loadImage({ url: url.href }).warn(cached);
    }

    if (!allowNetwork) {
      return errorMessage.data.path.notFound({
        type: 'file',
        path: cachePath.path,
      });
    }
    const data = await this.fetcher(url.href);
    if (isError(data)) return data;
    const writeRes = await cachePath.write(data);
    if (isError(writeRes))
      loggers().loadImage({ url: url.href }).warn(writeRes);
    return data.encodeURI(mimeType);
  }
}
