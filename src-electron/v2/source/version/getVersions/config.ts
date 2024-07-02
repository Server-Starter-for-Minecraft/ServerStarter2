import { z } from 'zod';
import { versionsCachePath } from '../../../core/const';
import { Version } from '../../../schema/version';
import { Bytes } from '../../../util/binary/bytes';
import { SHA1 } from '../../../util/binary/hash';
import { JsonSourceHandler } from '../../../util/wrapper/jsonFile';
import { AllVerison } from './base';

/**
 * Version全体の設定を保存するファイルを定義
 */
const VersConfigZod = z.object({
  version_manifest_v2_sha1: z.string().optional(),
  spigot_buildtool_sha1: z.string().optional(),
  versions_sha1: z
    .record(
      z.string().transform((ver) => ver as Version['type']),
      z.string()
    )
    .optional(),
});

const versConfigHandler = JsonSourceHandler.fromPath(
  versionsCachePath.child('config.json'),
  VersConfigZod
);

/**
 * バージョン全体として管理しておくべきHash等を読み取る
 */
export function getFromGeneralVerConfig() {
  return versConfigHandler.read();
}

/**
 * Minecraft公式APIから取得したマニフェストのHashを保管する
 */
export async function writeVersManifestHash(manifestData: Bytes) {
  const tmpConfig = await getFromGeneralVerConfig();
  if (tmpConfig.isErr) {
    return;
  }

  const hashRes = await manifestData.into(SHA1);
  if (hashRes.isErr) {
    return;
  }

  tmpConfig.value().version_manifest_v2_sha1 = hashRes.value();
  versConfigHandler.write(tmpConfig.value());
}

/**
 * SpigotをビルドするJarのHashを保管する
 */
export async function writeSpigotBuilderHash(hash: string) {
  const tmpConfig = await getFromGeneralVerConfig();
  if (tmpConfig.isOk) {
    tmpConfig.value().spigot_buildtool_sha1 = hash;
    versConfigHandler.write(tmpConfig.value());
  }
}

/**
 * 各サーバーのバージョン一覧Json（`all.json`）のHashを保管する
 */
export async function writeVersionListHash<T extends AllVerison>(
  verType: Version['type'],
  vers: T
) {
  const tmpConfig = await getFromGeneralVerConfig();
  if (tmpConfig.isErr) {
    return;
  }

  const verHash = await getVerListHash(vers);
  if (verHash.isErr) {
    return;
  }

  tmpConfig.value().versions_sha1 = {
    [verType]: verHash.value(),
  };
  versConfigHandler.write(tmpConfig.value());
}

/**
 * バージョン一覧オブジェクトのHash値を取得する
 */
export function getVerListHash<T extends AllVerison>(vers: T) {
  return Bytes.fromString(JSON.stringify(vers)).into(SHA1);
}
