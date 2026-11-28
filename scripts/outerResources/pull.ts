/**
 * 配布元（OuterResources）の最新の内容から，アプリに同梱する外部リソースを作る
 *
 * リリース時のビルド（`.github/workflows/build.yml`）で実行し，同梱データを最新の内容に保つ。
 * 失敗は Failable として呼び出し元（コマンドの実行）まで返し，処理を中断する
 */
import { ImageURI } from 'app/src-electron/schema/brands';
import { Failable } from 'app/src-electron/schema/error';
import {
  distributionPath,
  IMAGE_DATA_URI_REGEX,
  type OuterResourceDefinition,
  resolveImageSource,
} from 'app/src-electron/source/outerResource/definition';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { safeExec } from 'app/src-electron/util/error/failable';
import { asBrand } from 'app/src-electron/util/zod/brand';

/**
 * 配布元から配布ファイルや画像を読み込む関数
 *
 * @param path 配布元の `serverstarter2/` からのパス（例：`v1/donation.json`）。URL と同じくパーセントエンコードした表記で渡す
 * @returns 内容（読み込めない場合はエラー）
 */
export type DistributionReader = (path: string) => Promise<Failable<BytesData>>;

/**
 * 配布元の読み込み方を作る
 *
 * @param source 配布元の URL（`https://…/serverstarter2`），または OuterResources リポジトリの `serverstarter2/` ディレクトリのパス
 *               （配布元へ公開する前の内容から同梱データを作る場合に使う）
 */
export function createDistributionReader(source: string): DistributionReader {
  if (/^https?:\/\//.test(source)) {
    // エンコードした表記のまま URL に連結する（`%23` などを復号すると別の URL になるため）
    const base = source.replace(/\/+$/, '');
    return async (path) => BytesData.fromURL(`${base}/${path}`);
  }
  const root = new Path(source).absolute();
  return async (path) => {
    // ローカルのファイルとして読むためにエンコードを戻し，配布元のディレクトリの外を指すパスは読まない
    const decoded = safeExec(() => decodeURIComponent(path));
    if (isError(decoded)) return decoded;
    const file = root.child(decoded);
    const outside = errorMessage.data.path.loadingFailed({
      type: 'file',
      path: file.path,
    });
    if (!file.isWithin(root)) return outside;
    // シンボリックリンク・ジャンクションで配布元の外のファイル（秘密の情報など）を同梱しないよう，実体のパスでも確かめる
    const [realRoot, realFile] = await Promise.all([
      root.realPath(),
      file.realPath(),
    ]);
    if (isError(realRoot)) return realRoot;
    if (isError(realFile)) return realFile;
    if (!realFile.isWithin(realRoot)) return outside;
    return file.read();
  };
}

/**
 * 画像の参照先を解決するための，配布元（`serverstarter2/`）の仮の URL
 *
 * 配布元がローカルのディレクトリの場合も，アプリと同じ規則で参照先を解決するために使う（`.invalid` は実在しないドメイン）
 */
const DISTRIBUTION_BASE_URL = 'https://distribution.invalid/serverstarter2';

/**
 * 配布ファイルが参照する画像を読み込み，data URI にする
 *
 * 参照先の規則はアプリの読み込み（`resolveImageSource`）と同じ
 *
 * @param source 画像の参照先
 * @param path 配布ファイルの配布元でのパス（相対パスの基準）
 * @param read 配布元の読み込み方
 */
async function embedImage(
  source: string,
  path: string,
  read: DistributionReader
): Promise<Failable<ImageURI>> {
  if (source.startsWith('data:')) {
    return IMAGE_DATA_URI_REGEX.test(source)
      ? asBrand(ImageURI, source)
      : errorMessage.value.base64URI({ value: source });
  }
  const resolved = resolveImageSource(source, DISTRIBUTION_BASE_URL, path);
  if (isError(resolved)) return resolved;
  const { url, isSameOrigin, pathInDistribution, mimeType } = resolved;
  // 配布元の外を指す相対パス（`../` で遡るなど）は，仮の URL の外のため読み込めない
  if (isSameOrigin && pathInDistribution === undefined) {
    return errorMessage.data.url.unsupported({ url: source });
  }
  const image =
    pathInDistribution !== undefined
      ? // 配布元の `serverstarter2/` からのパス（エンコードした表記のまま渡す）
        await read(pathInDistribution)
      : await BytesData.fromURL(url.href);
  if (isError(image)) return image;
  return image.encodeURI(mimeType);
}

/**
 * 配布ファイルを読み込み，同梱する内容を作る
 *
 * - 配布ファイルがアプリのスキーマを厳格に満たさない場合は失敗する（不正な内容をアプリに同梱しないため）
 * - 配布ファイルが参照する画像は data URI としてファイル内に取り込む（オフラインの初回起動でも表示できるようにするため）
 *
 * @param def 外部リソースの定義
 * @param read 配布元の読み込み方
 * @returns 同梱する内容（失敗した場合はエラー）
 */
export async function buildBundledContent<W>(
  def: OuterResourceDefinition<W, unknown>,
  read: DistributionReader
): Promise<Failable<W>> {
  const path = distributionPath(def);
  const data = await read(path);
  if (isError(data)) return data;
  const parsed = await data.json(def.schema);
  if (isError(parsed) || def.embedAssets === undefined) return parsed;
  return def.embedAssets(parsed, async (source) =>
    embedImage(source, path, read)
  );
}
