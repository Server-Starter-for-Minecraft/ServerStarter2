/**
 * サーバー種別ごとの準備処理のテストで，`BytesData.fromURL`を差し替えるためのテスト用の補助関数
 *
 * Mojangの配布API(バージョン一覧・各バージョンの詳細JSON)は固定レスポンスを返し，
 * それ以外のURLはテストごとに指定したダミーファイルを返す．
 * テスト専用（本番コードからは参照しない）
 */
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/util/error/failable';

const fixtureDir = new Path(__dirname);

const VERSION_MANIFEST_URL =
  'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

/**
 * 各バージョンの詳細JSONのURL
 * (URLに内容のSHA1を含み内容が変わらないため，固定レスポンスとして保存しておける)
 */
const PISTON_META_URL =
  /^https:\/\/piston-meta\.mojang\.com\/v1\/packages\/([0-9a-f]{40})\/([^/]+\.json)$/;

/**
 * URLに対応するMojang APIの固定レスポンスを読み込む
 *
 * 固定レスポンスを追加する場合は，`piston-meta/`に元のURLのファイル名のまま保存する
 * (読み込み時にURL中のSHA1と照合するため，取り違えた場合はエラーになる)
 *
 * @param url `BytesData.fromURL`に渡されたURL
 * @returns 固定レスポンスがあるURLの場合はその内容，無い場合は`undefined`
 */
export function fromMojangFixture(
  url: string
): Promise<Failable<BytesData>> | undefined {
  if (url === VERSION_MANIFEST_URL) {
    return BytesData.fromPath(fixtureDir.child('version_manifest_v2.json'));
  }
  const [, sha1, fileName] = url.match(PISTON_META_URL) ?? [];
  if (sha1 === undefined || fileName === undefined) return undefined;
  const fixturePath = fixtureDir.child('piston-meta', fileName);
  if (!fixturePath.exists()) return undefined;
  return BytesData.fromPath(fixturePath, { type: 'sha1', value: sha1 });
}

/** URLの末尾が`suffix`のときに`fileName`(`version/test/`内のダミーファイル)を返す規則 */
export type DummyFileRule = { suffix: string; fileName: string };

/**
 * `BytesData.fromURL`の代わりに使う実装を作る
 *
 * 1. Mojang APIの固定レスポンス(`fromMojangFixture`)
 * 2. `rules`に一致するダミーファイル
 * 3. どちらにも当てはまらない場合は`fallback`(省略時は取得失敗のエラーを返し，外部サービスにはアクセスしない)
 *
 * の順に解決する．
 *
 * @param rules ダミーファイルを返すURLの規則
 * @param fallback 規則に当てはまらないURLの取得方法．
 *   外部APIとの連携を確認する`network`タグのテストでのみ，本来の`BytesData.fromURL`を渡す
 */
export function createFromURLMock(
  rules: DummyFileRule[],
  fallback?: (url: string) => Promise<Failable<BytesData>>
) {
  return async (url: string): Promise<Failable<BytesData>> => {
    const fixture = fromMojangFixture(url);
    if (fixture) return fixture;

    const rule = rules.find((r) => url.endsWith(r.suffix));
    if (rule) return BytesData.fromPath(fixtureDir.child(rule.fileName));

    if (fallback) return fallback(url);
    return errorMessage.data.url.fetch({
      url,
      status: 0,
      statusText: 'URL is not mocked in this test',
    });
  };
}
