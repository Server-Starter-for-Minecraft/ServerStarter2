import { SpigotVersion } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { Failable, isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { getJavaComponent } from './vanilla';
import { config } from '../../store';
import { spigotBuildPath, versionsPath } from '../const';
import * as cheerio from 'cheerio';
import { interactiveProcess } from '../../utils/subprocess';
import { readyJava } from '../../utils/java/java';
import { VersionLoader } from './interface';
import { getVersionMainfest } from './mainfest';

const spigotVersionsPath = versionsPath.child('spigot');

export const spigotVersionLoader: VersionLoader = {
  /** spigotのサーバーデータをダウンロード */
  async readyVersion(version: SpigotVersion) {
    const versionPath = spigotVersionsPath.child(version.id);
    const serverCwdPath = versionPath;
    const jarpath = versionPath.child(`${version.id}.jar`);

    // 適切なjavaのバージョンを取得
    const component = await getJavaComponent(version.id);
    if (isFailure(component)) return component;

    // ビルドツールのダウンロード
    const buildTool = await readySpigotBuildTool();
    if (isFailure(buildTool)) return buildTool;

    // ビルドの実行
    const buildResult = await buildSpigotVersion(version, jarpath);
    if (isFailure(buildResult)) return buildResult;

    return {
      programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
      serverCwdPath,
      component,
    };
  },

  /** spigotのバージョンの一覧返す */
  getAllVersions: getSpigotVersions,
};

const SPIGOT_VERSIONS_URL = 'https://hub.spigotmc.org/versions/';

/** バージョン一覧の取得 */
export async function getSpigotVersions(): Promise<Failable<SpigotVersion[]>> {
  const result = await BytesData.fromURL(SPIGOT_VERSIONS_URL);
  if (isFailure(result)) return result;

  const ids: string[] = [];

  cheerio
    .load(await result.text())('body > pre > a')
    .each((_, elem) => {
      const href = elem.attribs['href'];
      const match = href.match(/^(\d+\.\d+(?:\.\d+)?)\.json$/);
      if (match) {
        ids.push(match[1]);
      }
    });

  const manifest = await getVersionMainfest();

  if (isFailure(manifest)) return manifest;

  const entries: [string, number][] = manifest.versions.map(
    (version, index) => [version.id, index]
  );

  const versionIndexMap = Object.fromEntries(entries);

  ids.sort((a, b) => versionIndexMap[a] - versionIndexMap[b]);

  return ids.map((id) => ({
    type: 'spigot',
    id,
    release: true,
  }));
}

const buildToolPath = spigotBuildPath.child('BuildTools.jar');

const SPIGOT_BUILDTOOL_URL =
  'https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar';

/** ビルドツールのダウンロード */
export async function readySpigotBuildTool(): Promise<Failable<undefined>> {
  // ビルドツールをダウンロード
  let buildtool = await BytesData.fromURL(SPIGOT_BUILDTOOL_URL);

  // ビルドツールのダウンロードに失敗した場合ローカルにあるデータを使う
  if (isFailure(buildtool)) {
    // ハッシュ値をコンフィグから読み込む
    const sha1 = config.get('spigot_buildtool_sha1');
    if (sha1) {
      buildtool = await BytesData.fromPath(
        buildToolPath.absolute().str(),
        sha1
      );
    }
  }

  // ビルドツールが用意できなかった場合エラー
  if (isFailure(buildtool)) return buildtool;

  // ハッシュ値をコンフィグに保存
  config.set('spigot_buildtool_sha1', await buildtool.sha1());

  await buildToolPath.write(buildtool);
}

async function buildSpigotVersion(
  version: SpigotVersion,
  targetpath: Path
): Promise<Failable<undefined>> {
  // TODO: ほんとにjava-runtime-gammaで大丈夫?
  const javapath = await readyJava('java-runtime-gamma', false);
  if (isFailure(javapath)) return javapath;

  function handler(msg: string) {
    // TODO:ビルドログをロガーに出力
    console.log(msg);
  }

  // ビルドの開始
  const [_, process] = interactiveProcess(
    javapath.absolute().str(),
    ['-jar', buildToolPath.absolute().str(), '--rev', version.id],
    handler,
    handler,
    spigotBuildPath.absolute().str(),
    true
  );
  await process;

  // 移動先のディレクトリを作成
  targetpath.parent().mkdir(true);

  // jarファイルを移動
  await spigotBuildPath.child(`spigot-${version.id}.jar`).rename(targetpath);

  // 不要なファイルの削除
  await spigotBuildPath.child('work').remove(true);
}
