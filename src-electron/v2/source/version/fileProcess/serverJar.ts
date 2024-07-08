import {
  oldestMajorVersion,
  Runtime,
} from 'app/src-electron/v2/schema/runtime';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { MD5, SHA1, SHA256 } from 'app/src-electron/v2/util/binary/hash';
import { JavaVersionInfo } from './versionJson';

/**
 * ダウンロードしたJarのデータをHash値で確認する
 */
export async function checkJarHash(
  jarData: Bytes,
  correctHash: string,
  hashType: 'sha1' | 'sha256' | 'md5'
): Promise<Result<string>> {
  const hashProcesser = () => {
    switch (hashType) {
      case 'sha1':
        return SHA1;
      case 'sha256':
        return SHA256;
      case 'md5':
        return MD5;
    }
  };

  const downloadJarHash = (await jarData.into(hashProcesser())).onOk((hash) => {
    if (correctHash === hash) {
      return ok(hash);
    } else {
      return err(new Error('DOWNLOAD_INVALID_SERVER_JAR'));
    }
  });

  return downloadJarHash;
}

/**
 * 指定されたRuntimeオブジェクトを返す
 *
 * @param javaVersion `version.json`の'javaVersion'を渡す
 */
export function getRuntimeObj(
  runtimeType: Runtime['type'],
  javaVersion?: JavaVersionInfo
): Runtime {
  switch (runtimeType) {
    case 'minecraft':
      return {
        type: 'minecraft',
        version: javaVersion?.component ?? 'jre-legacy',
      };
    case 'universal':
      return {
        type: 'universal',
        majorVersion: javaVersion?.majorVersion ?? oldestMajorVersion,
      };
  }
}
