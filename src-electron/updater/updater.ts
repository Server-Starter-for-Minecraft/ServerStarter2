import { rootLogger } from '../common/logger';
import { OsPlatform } from '../schema/os';
import { getSystemSettings, setSystemSettings } from '../source/stores/system';
import { isError } from '../util/error/error';
import { osPlatform } from '../util/os/os';
import {
  loadUpdateAttempt,
  saveUpdateAttempt,
  shouldAutoInstall,
} from './attempt';
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
  logger.info('system version', await getSystemVersion());

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
  if (import.meta.env.QUASAR_DEBUG) return;

  const vLessVersion = update.version.slice(1);

  // 自動アップデートに対応していないOSでは、最新版があることを通知する
  const installer = INSTALLERS[osPlatform];
  if (installer === undefined) {
    await notifyUpdate(osPlatform, vLessVersion);
    return;
  }

  // 直近に同じバージョンへのアップデートを実行したにもかかわらず古いバージョンで起動している場合は、
  // アップデートに失敗したとみなし、アップデートを繰り返さずに現在のバージョンで起動して手動でのアップデートを促す
  const lastAttempt = await loadUpdateAttempt();
  if (!shouldAutoInstall(update.version, lastAttempt, Date.now())) {
    logger.warn('skip auto update because the last update failed', lastAttempt);
    await notifyUpdate(osPlatform, vLessVersion);
    return;
  }

  // lastUpdatedTimeをundefinedに
  const sys = await getSystemSettings();
  sys.system.lastUpdatedTime = undefined;
  await setSystemSettings(sys);

  await saveUpdateAttempt({
    version: update.version,
    attemptedAt: Date.now(),
  });
  const started = await installer(update.url, PAT);
  if (started) return;

  // ダウンロード等に失敗してインストーラーを起動できなかった場合は、現在のバージョンで起動して手動でのアップデートを促す
  logger.error('failed to start the installer');
  await notifyUpdate(osPlatform, vLessVersion);
}

/**
 * OSごとの自動アップデートの処理
 *
 * インストーラーを起動できた場合はアプリを終了してtrueを、失敗した場合はfalseを返す。
 * 自動アップデートに対応していないOSは含めない（最新版があることの通知のみ行う）
 */
const INSTALLERS: Partial<
  Record<OsPlatform, (url: string, pat: string | undefined) => Promise<boolean>>
> = {
  'windows-x64': installWindows,
  'mac-os': installMac,
  'mac-os-arm64': installMac,
};
