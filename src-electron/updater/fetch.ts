import { Failable } from '../schema/error';
import { OsPlatform } from '../schema/os';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';
import { listReleases, ReleaseAsset } from '../util/github/schema/release';

/**
 * GitHubのリリース一覧から，指定したOS向けのインストーラーがある最新のリリースを取得する
 *
 * Personal Access Tokenを指定した場合はDraftのリリースも一覧に含まれ，更新対象となる。
 * これはリリース前の動作確認でDraftのインストーラーを使うための意図した挙動である
 *
 * @param osPLatform 対象のOS
 * @param pat GitHubのPersonal Access Token（動作確認用。通常は未指定）
 * @returns 最新のリリースの情報（取得に失敗した場合や，対象のアセットがない場合はエラー）
 */
export async function getLatestRelease(
  osPLatform: OsPlatform,
  pat: string | undefined
): Promise<Failable<GithubRelease>> {
  const json = await listReleases(
    'Server-Starter-for-Minecraft',
    'ServerStarter2',
    pat
  );

  if (isError(json)) return json;

  for (const i of json) {
    const url = findAsset(i.assets, i.tag_name, osPLatform);
    if (url)
      return {
        platform: osPLatform,
        version: i.tag_name,
        url,
      };
  }

  return errorMessage.system.assertion({ message: '' });
}

/**
 * OSごとのインストーラーのファイル名の末尾
 *
 * リリースのアセット名は `ServerStarter-<タグ名><末尾>`（e.g. `ServerStarter-v2.3.0-silicon.pkg`）とする。
 * ビルドスクリプト（.github/workflows/build.yml）でアップロードするアセット名と一致させること。
 * 新しいOS・アーキテクチャに対応する場合は、ここにエントリを追加する。
 *
 * 注意：v2.2.0以前のアップデーターは、リリース内で最初に見つかった `.pkg` をインストールする。
 * v2.2.0のmacOS版はIntel版のため、GitHubがアセットを名前順に並べたときにIntel版が先頭になるよう、
 * Intel版を `-intel`、Apple Silicon版を `-silicon` とする（`-x64` / `-arm64` ではApple Silicon版が先頭になる）
 */
const ASSET_SUFFIX: Record<OsPlatform, string> = {
  redhat: '.rpm',
  debian: '.deb',
  'mac-os': '-intel.pkg',
  'mac-os-arm64': '-silicon.pkg',
  'windows-x64': '.msi',
};

/**
 * リリースのアセットから、指定したOS向けのインストーラーを探す
 *
 * 動作確認用に別バージョンのアセットが同じリリースに含まれていても誤って選ばないよう、
 * タグ名と一致するアセットのみを対象とする
 *
 * @param assets リリースに含まれるアセット
 * @param tagName リリースのタグ名
 * @param osPLatform 対象のOS
 * @returns インストーラーのダウンロードURL（見つからない場合はundefined）
 */
function findAsset(
  assets: ReleaseAsset[],
  tagName: string,
  osPLatform: OsPlatform
) {
  const name = `ServerStarter-${tagName}${ASSET_SUFFIX[osPLatform]}`;
  return assets.find((asset) => asset.name === name)?.url;
}

export type GithubRelease = {
  platform: OsPlatform;
  /** 接頭辞vのついたSemVar e.g. "v1.2.3" */
  version: string;
  url: string;
};
