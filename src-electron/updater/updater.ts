import { rootLogger } from '../common/logger';
import { OsPlatform } from '../schema/os';
import { getSystemSettings, setSystemSettings } from '../source/stores/system';
import { isError } from '../util/error/error';
import { isRunningUnderRosetta, osPlatform } from '../util/os/os';
import {
  loadUpdateAttempt,
  saveUpdateAttempt,
  shouldAutoInstall,
} from './attempt';
import { getLatestRelease } from './fetch';
import { installMac } from './installer/mac';
import { installWindows } from './installer/windows';
import { notifyUpdate } from './notify';
import { isNewerVersion } from './semver';
import { getSystemVersion } from './version';

/**
 * アップデート先のインストーラーの対象OSを判定する
 *
 * Apple Silicon上でIntel版をRosetta経由で実行している場合は、Apple Silicon版へ移行する
 * （v2.2.0以前はIntel版のみを配布していたため）
 * 移行は通常のアップデートと同時に行う（起動中より新しいバージョンがない場合は、同じバージョンのApple Silicon版へは入れ替えない）
 *
 * @returns アップデート先のインストーラーの対象OS
 */
function getUpdatePlatform(): OsPlatform {
  if (osPlatform === 'mac-os' && isRunningUnderRosetta()) return 'mac-os-arm64';
  return osPlatform;
}

/**
 * アップデートがあるかどうかチェック
 * 本体バージョンはpackage.jsonのversionを参照
 * リモートのバージョンはgithubのリリース情報のtag_nameを参照
 */
async function checkUpdate(pat: string | undefined) {
  /** 接頭辞vのついていないSemVar e.g. "1.2.3" */
  const currentVersion = await getSystemVersion();
  const latestRelease = await getLatestRelease(getUpdatePlatform(), pat);
  // アップデートの取得に失敗
  if (isError(latestRelease)) return latestRelease;
  // アップデートなし（ダウングレードを防ぐため、起動中のバージョンより新しい場合のみ更新する）
  if (!isNewerVersion(latestRelease.version, currentVersion)) return false;
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
    logger.info('already up to date');
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
  const platform = update.platform;

  // 自動アップデートに対応していないOSでは、最新版があることを通知する
  const installer = INSTALLERS[platform];
  if (installer === undefined) {
    await notifyUpdate(platform, vLessVersion);
    return;
  }

  // 直近に同じバージョンへのアップデートを実行したにもかかわらず古いバージョンで起動している場合は、
  // アップデートに失敗したとみなし、アップデートを繰り返さずに現在のバージョンで起動して手動でのアップデートを促す
  const lastAttempt = await loadUpdateAttempt();
  if (!shouldAutoInstall(update.version, lastAttempt, Date.now())) {
    logger.warn('skip auto update because the last update failed', lastAttempt);
    await notifyUpdate(platform, vLessVersion);
    return;
  }

  // 実行記録を保存できない場合は、失敗時にアップデートを繰り返すおそれがあるため自動アップデートを行わない
  const saved = await saveUpdateAttempt({
    version: update.version,
    attemptedAt: Date.now(),
  });
  if (isError(saved)) {
    logger.error('failed to save the update attempt', saved);
    await notifyUpdate(platform, vLessVersion);
    return;
  }

  // lastUpdatedTimeをundefinedに（アップデート後の初回起動で更新日時が記録される）
  const sys = await getSystemSettings();
  const prevUpdatedTime = sys.system.lastUpdatedTime;
  sys.system.lastUpdatedTime = undefined;
  await setSystemSettings(sys);

  const started = await installer(update.url, PAT);
  if (started) return;

  // ダウンロード等に失敗してインストーラーを起動できなかった場合は、
  // アップデートしていないため更新日時を戻し、現在のバージョンで起動して手動でのアップデートを促す
  logger.error('failed to start the installer');
  sys.system.lastUpdatedTime = prevUpdatedTime;
  await setSystemSettings(sys);
  await notifyUpdate(platform, vLessVersion);
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
