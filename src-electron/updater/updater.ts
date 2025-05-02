import { rootLogger } from '../common/logger';
import { getSystemSettings, setSystemSettings } from '../source/stores/system';
import { isError } from '../util/error/error';
import { osPlatform } from '../util/os/os';
import { getLatestRelease } from './fetch';
import { installMac } from './installer/mac';
import { installWindows } from './installer/windows';
import { notifyUpdate } from './notify';
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
  const logger = rootLogger.update({});
  logger.info('start');
  logger.trace('system version', await getSystemVersion());

  // 環境変数SERVERSTARTER_MODEが"debug"だった場合は環境変数SERVERSTARTER_TOKENからgitのPATを取得
  const PAT =
    process.env.SERVERSTARTER_MODE === 'debug'
      ? process.env.SERVERSTARTER_TOKEN
      : undefined;

  const update = await checkUpdate(PAT);

  if (update === false) {
    logger.error(update);
    return;
  }

  if (isError(update)) {
    logger.error(update);
    return;
  }
  logger.info(update);

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

  logger.info('success');
}
