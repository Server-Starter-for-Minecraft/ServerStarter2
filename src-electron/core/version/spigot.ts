import { AllSpigotVersion, SpigotVersion } from 'src-electron/schema/version';
import { Path } from '../../util/path';
import { Failable } from '../../util/error/failable';
import { BytesData } from '../../util/bytesData';
import { JavaComponent, getJavaComponent } from './vanilla';
import { versionConfig } from '../stores/config';
import { spigotBuildPath, versionsCachePath } from '../const';
import * as cheerio from 'cheerio';
import { interactiveProcess } from '../../util/subprocess';
import { readyJava } from '../../util/java/java';
import {
  VersionComponent,
  VersionLoader,
  genGetAllVersions,
  needEulaAgreementVanilla,
} from './base';
import { getVersionMainfest } from './mainfest';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { GroupProgressor } from '../progress/progress';

const spigotVersionsPath = versionsCachePath.child('spigot');

export const spigotVersionLoader: VersionLoader<SpigotVersion> = {
  /** spigotのサーバーデータを必要があればダウンロード */
  readyVersion: readySpigotVersion,

  /** spigotのバージョンの一覧返す */
  getAllVersions: genGetAllVersions<SpigotVersion>('spigot', getSpigotVersions),

  needEulaAgreement: needEulaAgreementVanilla,
};

/** spigotのサーバーデータを必要があればダウンロード */
async function readySpigotVersion(
  version: SpigotVersion,
  cwdPath: Path,
  progress?: GroupProgressor
): Promise<Failable<VersionComponent>> {
  progress?.title({
    key: 'server.readyVersion.title',
    args: { version: version },
  });
  const versionPath = spigotVersionsPath.child(version.id);
  const jarpath = versionPath.child(`${version.type}-${version.id}.jar`);

  // 適切なjavaのバージョンを取得
  const b = progress?.subtitle({
    key: 'server.readyVersion.spigot.loadBuildJavaVersion',
  });
  const component = await getJavaComponent(version.id);
  b?.delete();
  if (isError(component)) return component;

  // server.jarが存在しなかった場合の処理
  if (!jarpath.exists()) {
    // ビルドツールのダウンロード
    const b = progress?.subtitle({
      key: 'server.readyVersion.spigot.readyBuildtool',
    });
    const buildTool = await readySpigotBuildTool();
    b?.delete();
    if (isError(buildTool)) return buildTool;

    // ビルドの実行
    const buildResult = await buildSpigotVersion(
      version,
      jarpath,
      component,
      progress
    );
    if (isError(buildResult)) return buildResult;
  }

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    component,
  };
}

const SPIGOT_VERSIONS_URL = 'https://hub.spigotmc.org/versions/';

/** バージョン一覧の取得 */
async function getSpigotVersions(): Promise<Failable<AllSpigotVersion>> {
  const result = await BytesData.fromURL(SPIGOT_VERSIONS_URL);
  if (isError(result)) return result;

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

  if (isError(manifest)) return manifest;

  const entries: [string, number][] = manifest.versions.map(
    (version, index) => [version.id, index]
  );

  const versionIndexMap = Object.fromEntries(entries);

  ids.sort((a, b) => versionIndexMap[a] - versionIndexMap[b]);

  return ids.map((id) => ({
    id,
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
  if (isError(buildtool)) {
    // ハッシュ値をコンフィグから読み込む
    const sha1 = versionConfig.get('spigot_buildtool_sha1');
    if (sha1) {
      buildtool = await BytesData.fromPath(buildToolPath.absolute(), {
        type: 'sha1',
        value: sha1,
      });
    }
  }

  // ビルドツールが用意できなかった場合エラー
  if (isError(buildtool)) return buildtool;

  // ハッシュ値をコンフィグに保存
  versionConfig.set('spigot_buildtool_sha1', await buildtool.hash('sha1'));

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
  javaComponent: JavaComponent,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  const VERSION_URL = `https://hub.spigotmc.org/versions/${version.id}.json`;

  // spigotのデータを取得する(実行javaバージョンの確認するため)
  const l = progress?.subtitle({
    key: 'server.readyVersion.spigot.loadBuildData',
  });
  const data = await BytesData.fromURL(VERSION_URL);
  if (isError(data)) return data;
  const json = await data.json<SpigotVersionData>();
  l?.delete();

  if (isError(json)) return json;

  const versionTuple = json.javaVersions;
  if (versionTuple) {
    const [min, max] = versionTuple;
    if (min <= 51 && 51 <= max) javaComponent = 'jre-legacy';
    else if (min <= 60 && 60 <= max) javaComponent = 'java-runtime-alpha';
    else if (min <= 61 && 61 <= max) javaComponent = 'java-runtime-gamma';
    else
      return errorMessage.core.version.failSpigotBuild.javaNeeded({
        spigotVersion: version.id,
        minVersion: `java-${min - 44}`,
        maxVersion: `java-${max - 44}`,
      });
  }

  const j = progress?.subtitle({
    key: 'server.readyVersion.spigot.readyBuildJava',
  });
  const javapath = await readyJava(javaComponent, false);
  j?.delete();
  if (isError(javapath)) return javapath;

  const d = progress?.subtitle({
    key: 'server.readyVersion.spigot.building',
  });
  const console_progress = progress?.console();

  const push = (chunk: string) => {
    console_progress?.push(chunk);
  };

  // ビルドの開始
  const process = interactiveProcess(
    javapath.absolute().str(),
    [
      '-Dfile.encoding=UTF-8',
      '-jar',
      buildToolPath.absolute().str(),
      '--rev',
      version.id,
    ],
    push,
    push,
    spigotBuildPath.absolute().str(),
    true
  );

  const result = await process;
  d?.delete();
  console_progress?.delete();

  // ビルド失敗した場合エラー
  if (isError(result)) return result;

  // 移動先のディレクトリを作成
  targetpath.parent().mkdir(true);

  // jarファイルを移動
  const m = progress?.subtitle({
    key: 'server.readyVersion.spigot.moving',
  });

  await spigotBuildPath.child(`spigot-${version.id}.jar`).rename(targetpath);

  // 不要なファイルの削除
  await spigotBuildPath.child('work').remove(true);

  m?.delete();
}
