import { SpigotVersion } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { Failable, isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { JavaComponent, getJavaComponent } from './vanilla';
import { config } from '../../config';
import { spigotBuildPath, versionsPath } from '../const';
import * as cheerio from 'cheerio';
import { interactiveProcess } from '../../utils/subprocess';
import { readyJava } from '../../utils/java/java';
import { VersionComponent, VersionLoader, genGetAllVersions } from './base';
import { getVersionMainfest } from './mainfest';

const spigotVersionsPath = versionsPath.child('spigot');

export const spigotVersionLoader: VersionLoader<SpigotVersion> = {
  /** spigotのサーバーデータを必要があればダウンロード */
  readyVersion: readySpigotVersion,

  /** spigotのバージョンの一覧返す */
  getAllVersions: genGetAllVersions('spigot', getSpigotVersions),
};

/** spigotのサーバーデータを必要があればダウンロード */
async function readySpigotVersion(
  version: SpigotVersion
): Promise<Failable<VersionComponent>> {
  const versionPath = spigotVersionsPath.child(version.id);
  const jarpath = versionPath.child(`${version.type}-${version.id}.jar`);

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isFailure(component)) return component;

  // server.jarが存在しなかった場合の処理
  if (!jarpath.exists()) {
    // ビルドツールのダウンロード
    const buildTool = await readySpigotBuildTool();
    if (isFailure(buildTool)) return buildTool;

    // ビルドの実行
    const buildResult = await buildSpigotVersion(version, jarpath, component);
    if (isFailure(buildResult)) return buildResult;
  }

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    component,
  };
}

const SPIGOT_VERSIONS_URL = 'https://hub.spigotmc.org/versions/';

/** バージョン一覧の取得 */
async function getSpigotVersions(): Promise<Failable<SpigotVersion[]>> {
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
async function readySpigotBuildTool(): Promise<Failable<undefined>> {
  // ビルドツールをダウンロード
  let buildtool = await BytesData.fromURL(SPIGOT_BUILDTOOL_URL);

  // ビルドツールのダウンロードに失敗した場合ローカルにあるデータを使う
  if (isFailure(buildtool)) {
    // ハッシュ値をコンフィグから読み込む
    const sha1 = config.get('spigot_buildtool_sha1');
    if (sha1) {
      buildtool = await BytesData.fromPath(buildToolPath.absolute().str(), {
        type: 'sha1',
        value: sha1,
      });
    }
  }

  // ビルドツールが用意できなかった場合エラー
  if (isFailure(buildtool)) return buildtool;

  // ハッシュ値をコンフィグに保存
  config.set('spigot_buildtool_sha1', await buildtool.hash('sha1'));

  await buildToolPath.write(buildtool);
}

type SpigotVersionData = {
  name: string;
  description: string;
  refs: {
    BuildData: string;
    Bukkit: string;
    CraftBukkit: string;
    Spigot: string;
  };
  toolsVersion: number;
  javaVersions?: [number, number];
};

async function buildSpigotVersion(
  version: SpigotVersion,
  targetpath: Path,
  javaComponent: JavaComponent
): Promise<Failable<undefined>> {
  // TODO: ほんとにjava-runtime-gammaで大丈夫?
  // if (javaComponent == 'jre-legacy') {
  //   javaComponent = 'java-runtime-alpha';
  // }

  const VERSION_URL = `https://hub.spigotmc.org/versions/${version.id}.json`;

  // spigotのデータを取得する(実行javaバージョンの確認するため)
  const data = await BytesData.fromURL(VERSION_URL);
  if (isFailure(data)) return data;
  const json = await data.json<SpigotVersionData>();

  if (isFailure(json)) return json;

  const versionTuple = json.javaVersions;
  if (versionTuple) {
    const [min, max] = versionTuple;
    if (min <= 51 && 51 <= max) javaComponent = 'jre-legacy';
    else if (min <= 60 && 60 <= max) javaComponent = 'java-runtime-alpha';
    else if (min <= 61 && 61 <= max) javaComponent = 'java-runtime-gamma';
    else
      return new Error(
        `to build spigot-${version.id} java-${min - 44} ~ java-${
          max - 44
        } is needed`
      );
  }

  const javapath = await readyJava(javaComponent, false);
  if (isFailure(javapath)) return javapath;

  function handler(msg: string) {
    // TODO:ビルドログをロガーに出力
  }

  // ビルドの開始
  const process = interactiveProcess(
    javapath.absolute().str(),
    ['-jar', buildToolPath.absolute().str(), '--rev', version.id],
    handler,
    handler,
    spigotBuildPath.absolute().str(),
    true
  );

  const result = await process;

  // ビルド失敗した場合エラー
  if (isFailure(result)) return result;

  // 移動先のディレクトリを作成
  targetpath.parent().mkdir(true);

  // jarファイルを移動
  await spigotBuildPath.child(`spigot-${version.id}.jar`).rename(targetpath);

  // 不要なファイルの削除
  await spigotBuildPath.child('work').remove(true);
}
