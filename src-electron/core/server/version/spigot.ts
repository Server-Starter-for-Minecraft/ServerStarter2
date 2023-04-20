import { SpigotVersion } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { Failable, isFailure } from '../../utils/result';
import { BytesData } from '../../utils/bytesData/bytesData';
import { JavaComponent, getVanillaVersionJson } from './vanilla';
import { config } from '../../store';
import { spigotBuildPath, versionsPath } from '../const';
import * as cheerio from 'cheerio';
import { interactiveProcess } from '../../utils/subprocess';
import { readyJava } from '../../utils/java/java';
import { VersionLoader } from './interface';

const spigotVersionsPath = versionsPath.child('spigot');

export const spigotVersionLoader: VersionLoader = {
  /** spigotのサーバーデータをダウンロード */
  async readyVersion(
    version: SpigotVersion
  ): Promise<Failable<{ jarpath: Path; component: JavaComponent }>> {
    const json = await getVanillaVersionJson(version.id);

    // jsonデータに変換できなかった場合
    if (isFailure(json)) return json;

    // ビルドツールのダウンロード
    const buildTool = await readySpigotBuildTool();
    if (isFailure(buildTool)) return buildTool;

    const jarpath = spigotVersionsPath.child(`${version.id}/${version.id}.jar`);

    // ビルドの実行
    const buildResult = await buildSpigotVersion(version, jarpath);
    if (isFailure(buildResult)) return buildResult;

    return {
      jarpath,
      component: json.javaVersion.component,
    };
  },
};

const SPIGOT_VERSIONS_URL = 'https://hub.spigotmc.org/versions/';
// /** バージョン一覧の取得 */
// export async function getSpigotVersions(): Promise<Failable<undefined>> {
//   const result = await BytesData.fromURL(SPIGOT_VERSIONS_URL);
//   if (isFailure(result)) return result;

//   const ids = cheerio
//     .load(await result.text())('body > pre > a')
//     .map((_, elem) => elem.attribs['href'].slice(0, -5));

//   const vanillaMap = await _VanillaVersion.getVersionMap();
//   const versions = [];
//   const idset = new Set(ids.slice(1));

//   for (let record of Object.values(vanillaMap)) {
//     if (idset.has(record.id)) {
//       const v: SpigotVerison = {
//         id: record.id,
//         type: 'spigot',
//         release: record.type === 'release',
//       };
//       versions.push(v);
//     }
//   }
//   return versions;
// }

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
  const javapath = await readyJava('java-runtime-gamma');
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
