import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { SHA1 } from 'app/src-electron/v2/util/binary/hash';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { getJarPath } from './base';

/**
 * Jarファイルを所定の位置にセットする
 *
 * Jarのキャッシュがない場合はダウンロードデータをセットする
 *
 * @param [targetData=['libraries']] JarとEulaのほかにキャッシュで管理しているバージョンデータ（規定値は`libraries`フォルダのみ）
 * @param downloadJar 所定のJarをダウンロードして`targetJarPath`に書き出す
 */
export async function setJar(
  cachePath: Path,
  targetPath: Path,
  downloadJar: (targetJarPath: Path) => Promise<Result<void>>,
  targetData: string[] = ['libraries']
) {
  const cacheJarPath = getJarPath(cachePath);
  const targetjarPath = getJarPath(targetPath);
  // キャッシュがある場合はキャッシュからJarをセット
  if (cacheJarPath.exists()) {
    await cacheJarPath.copyTo(targetjarPath);
    // targetData, eulaはあってもなくても良いため，チェックせずにコピーしようとさせる
    await cachePath.child('eula.txt').copyTo(targetPath.child('eula.txt'));
    await Promise.all(
      targetData.map((d) => cachePath.child(d).copyTo(targetPath.child(d)))
    );
  } else {
    // Jarのフォルダを作成しておく
    await targetjarPath.mkdir();

    // Jarのダウンロード
    return await downloadJar(targetjarPath);
  }
  return ok();
}

/**
 * ダウンロードしたJarのデータをHash値で確認する
 */
export async function checkJarHash(jarData: Bytes, correctHash: string) {
  const downloadJarHash = (await jarData.into(SHA1)).onOk((hash) => {
    if (correctHash === hash) {
      return ok(hash);
    } else {
      return err(new Error('DOWNLOAD_INVALID_SERVER_JAR'));
    }
  });
  if (downloadJarHash.isErr) return downloadJarHash;
}

/**
 * セットしたJarをキャッシュへ撤退させる
 */
export async function removeJars(
  jarDir: Path,
  cacheDir: Path,
  targetData: string[] = ['libraries']
) {
  const removeJarPath = getJarPath(jarDir);
  const removeEulaPath = jarDir.child('eula.txt');

  // キャッシュにデータを戻す
  await removeJarPath.copyTo(getJarPath(cacheDir));
  await removeEulaPath.copyTo(cacheDir.child('eula.txt'));

  // 実行時のバージョンデータを削除
  await removeJarPath.remove();
  await removeEulaPath.remove();

  // その他のバージョン関連データも同様に対応
  await Promise.all(
    targetData.map(async (d) => {
      const removeDataInJarDir = jarDir.child(d);
      await removeDataInJarDir.copyTo(cacheDir.child(d));
      await removeDataInJarDir.remove();
    })
  );

  return ok();
}
