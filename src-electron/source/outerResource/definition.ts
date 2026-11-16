import type { z } from 'zod';
import type { ImageURI } from 'app/src-electron/schema/brands';
import type { Failable } from 'app/src-electron/schema/error';
import type { BytesData } from 'app/src-electron/util/binary/bytesData';

/**
 * 外部リソースの定義に関する型と関数
 *
 * Electron に依存しないため，スクリプト（`scripts/outerResources`）からも読み込める
 */

/** 外部リソースの配布元（OuterResources リポジトリの main）の URL */
export const DEFAULT_OUTER_RESOURCE_BASE_URL =
  'https://raw.githubusercontent.com/Server-Starter-for-Minecraft/OuterResources/main/serverstarter2';

/** 画像の data URI として受け付ける形式 */
export const IMAGE_DATA_URI_REGEX =
  /^data:image\/(png|webp|svg\+xml|jpeg);base64,[A-Za-z0-9+/]+=*$/;

/** URL から読み込む画像の拡張子と MIME タイプの対応 */
export const IMAGE_MIME_TYPES: Readonly<Record<string, string>> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/** URL からデータを取得する関数（テストではローカルサーバーやモックに差し替える） */
export type OuterResourceFetcher = (
  url: string
) => Promise<Failable<BytesData>>;

/** 外部リソースを解決する（フロントエンドへ渡す形にする）際に使える機能 */
export type OuterResourceContext = {
  /**
   * 画像を読み込み，data URI にして返す
   *
   * @param source 配布ファイルからの相対パス・https の URL・画像の data URI のいずれか
   * @returns 画像の data URI（読み込めない場合はエラー）
   */
  loadImage(source: string): Promise<Failable<ImageURI>>;
  /**
   * 解決中に見つかった問題をログに残す（配布ファイルの誤りの調査用。ユーザーには表示しない）
   *
   * @param message 問題の内容
   * @param detail 問題の詳細（対象のキーなど）
   */
  warn(message: string, detail?: object): void;
};

/**
 * 外部リソースの定義
 *
 * 新しい外部リソースを追加する場合は，この定義を作成して `definitions.ts` に登録する
 *
 * @template W 配布ファイル（JSON）の型
 * @template R フロントエンドへ渡す，解決後の型
 */
export interface OuterResourceDefinition<W, R> {
  /** リソースの名前（ログに使う） */
  key: string;
  /**
   * 配布ファイルのスキーマのバージョン（配布元の `v{schemaVersion}/` ディレクトリから取得する）
   *
   * 旧バージョンのアプリが読めなくなる変更（項目の削除・意味の変更）をする場合にのみ上げる
   */
  schemaVersion: number;
  /** 配布ファイルの名前（例：`donation.json`） */
  fileName: string;
  /** 配布ファイルの厳格なスキーマ（JSON Schema の生成や配布ファイルの検証に使う） */
  schema: z.ZodType<W>;
  /** 配布ファイルの読み込み用パーサー（不正な要素だけを除いて読み込む） */
  parser: z.ZodType<W, any>;
  /**
   * 同梱の内容（配布ファイルもキャッシュも読めない場合に使う）
   *
   * リリース時のビルドで配布元の最新の内容に更新される（`bun run outer-resources pull`）
   */
  bundled: W;
  /**
   * 同梱する際に，配布ファイルが参照する画像などをファイル内に取り込む（オフラインの初回起動でも表示できるようにする）
   *
   * 画像を参照しない外部リソースでは省略する
   *
   * @param wire 配布ファイルの内容
   * @param loadImage 画像を読み込み data URI にして返す関数
   * @returns 画像を data URI に置き換えた配布ファイルの内容
   */
  embedAssets?(
    wire: W,
    loadImage: OuterResourceContext['loadImage']
  ): Promise<Failable<W>>;
  /**
   * 配布ファイルの内容をフロントエンドへ渡す形に解決する
   *
   * 付属ファイルの読み込みなどに失敗しても，その部分を省くなどして必ず値を返すこと
   */
  resolve(wire: W, ctx: OuterResourceContext): Promise<R>;
}

/**
 * 配布元での配布ファイルのパス（例：`v1/donation.json`）
 *
 * @param def 外部リソースの定義
 */
export function distributionPath(
  def: Pick<
    OuterResourceDefinition<unknown, unknown>,
    'schemaVersion' | 'fileName'
  >
) {
  return `v${def.schemaVersion}/${def.fileName}`;
}
