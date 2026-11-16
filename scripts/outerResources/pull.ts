/**
 * 配布元（OuterResources）の最新の内容から，アプリに同梱する外部リソースを作る
 *
 * リリース時のビルド（`.github/workflows/build.yml`）で実行し，同梱データを最新の内容に保つ。
 * スクリプトのため，失敗は例外として呼び出し元（コマンドの実行）まで伝え，処理を中断する
 */
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import type { ImageURI } from 'app/src-electron/schema/brands';
import {
  distributionPath,
  IMAGE_DATA_URI_REGEX,
  IMAGE_MIME_TYPES,
  type OuterResourceDefinition,
} from 'app/src-electron/source/outerResource/definition';
import { isError } from 'app/src-electron/util/error/error';
import { safeExecAsync } from 'app/src-electron/util/error/failable';

/**
 * 配布元から配布ファイルや画像を読み込む関数
 *
 * @param path 配布元の `serverstarter2/` からのパス（例：`v1/donation.json`）
 * @returns 内容（読み込めない場合は例外を投げる）
 */
export type DistributionReader = (path: string) => Promise<Buffer>;

/**
 * 配布元の読み込み方を作る
 *
 * @param source 配布元の URL（`https://…/serverstarter2`），または OuterResources リポジトリの `serverstarter2/` ディレクトリのパス
 *               （配布元へ公開する前の内容から同梱データを作る場合に使う）
 */
export function createDistributionReader(source: string): DistributionReader {
  if (/^https?:\/\//.test(source)) {
    return async (path) => {
      const url = `${source.replace(/\/+$/, '')}/${path}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`failed to fetch ${url} (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    };
  }
  return (path) => readFile(join(source, path));
}

/**
 * 配布ファイルを読み込み，同梱する内容を作る
 *
 * - 配布ファイルがアプリのスキーマを厳格に満たさない場合は失敗する（不正な内容をアプリに同梱しないため）
 * - 配布ファイルが参照する画像は data URI としてファイル内に取り込む（オフラインの初回起動でも表示できるようにするため）
 *
 * @param def 外部リソースの定義
 * @param read 配布元の読み込み方
 * @returns 同梱する内容
 */
export async function buildBundledContent<W>(
  def: OuterResourceDefinition<W, unknown>,
  read: DistributionReader
): Promise<W> {
  const path = distributionPath(def);
  const parsed = def.schema.safeParse(
    JSON.parse((await read(path)).toString('utf-8'))
  );
  if (!parsed.success) {
    throw new Error(
      `${path} does not match the schema: ${JSON.stringify(parsed.error.issues)}`
    );
  }
  if (def.embedAssets === undefined) return parsed.data;

  const embedded = await def.embedAssets(parsed.data, (source) =>
    safeExecAsync(async () => {
      if (IMAGE_DATA_URI_REGEX.test(source)) return source as ImageURI;
      // 画像は配布ファイルからの相対パス（配布元の同じ場所）のみ取り込む
      const mimeType = IMAGE_MIME_TYPES[extname(source).toLowerCase()];
      if (/^[a-z]+:/i.test(source) || mimeType === undefined) {
        throw new Error(`unsupported image: ${source}`);
      }
      // 相対パスを配布元の `serverstarter2/` からのパスに直す（URL のエンコードは元に戻す）
      const imagePath = new URL(source, `https://base/${path}`).pathname;
      const image = await read(decodeURIComponent(imagePath.slice(1)));
      return `data:${mimeType};base64,${image.toString('base64')}` as ImageURI;
    })
  );
  if (isError(embedded)) {
    throw new Error(
      `failed to embed assets of ${path}: ${JSON.stringify(embedded)}`
    );
  }
  return embedded;
}
