import { rootLoggerHierarchy } from '../core/logger';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { isError } from '../util/error/error';
import { osPlatform } from '../util/os';
import { getLatestRelease } from './fetch';
import { notifyUpdate } from './notify';
import { installMac } from './installer/mac';
import { installWindows } from './installer/windows';
import { getSystemVersion } from './version';

/**
 * アップデートがあるかどうかチェック
 * 本体バージョンはpackage.jsonのversionを参照
 * リモートのバージョンはgithubのリリース情報のtag_nameを参照
 */
async function checkUpdate(pat: string | undefined) {
  /** 接頭辞vのついていないSemVar e.g. "1.2.3" */
  const currentVersion = await getSystemVersion();
  const latestRelease = await getLatestRelease(osPlatform, pat);
  // アップデートの取得に失敗
  if (isError(latestRelease)) return latestRelease;
  // アップデートなし
  if (`v${currentVersion}` === latestRelease.version) return false;
  return latestRelease;
}

/**
 * アップデートがあるかどうかチェックしてアップデート
 * 本体バージョンはpackage.jsonのversionを参照
 * リモートのバージョンはgithubのリリース情報のtag_nameを参照
 */
export async function update() {
  const logger = rootLoggerHierarchy.update({});
  logger.start(getSystemVersion());

  // 環境変数SERVERSTARTER_MODEが"debug"だった場合は環境変数SERVERSTARTER_TOKENからgitのPATを取得
  const PAT =
    process.env.SERVERSTARTER_MODE === 'debug'
      ? process.env.SERVERSTARTER_TOKEN
      : undefined;

  const update = await checkUpdate(PAT);
  logger.info(update);

  if (update === false) return;

  if (isError(update)) return;

  // 環境変数DEBUGGING==true(yarn devで起動した場合)実際のアップデート処理は行わない
  if (process.env.DEBUGGING) return;

  // lastUpdatedTimeをundefinedに
  const sys = await getSystemSettings();
  sys.system.lastUpdatedTime = undefined;
  await setSystemSettings(sys);

  const vLessVersion = update.version.slice(1);

  switch (osPlatform) {
    case 'windows-x64':
      await installWindows(update.url, PAT);
      break;
    case 'mac-os':
    case 'mac-os-arm64':
      await installMac(update.url, PAT);
      break;
    case 'debian':
    case 'redhat':
      await notifyUpdate(osPlatform, vLessVersion);
      break;
  }

  logger.success();
}
