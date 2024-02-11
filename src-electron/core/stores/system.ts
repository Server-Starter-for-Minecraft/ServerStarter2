import { settingPath } from '../const';
import { AppSettingHandler } from '../file/handler/appSetting';
import { AppSettings$1 } from '../file/schama/app';

const appSettings = new AppSettingHandler(settingPath, AppSettings$1);

export async function getSystemSettings(): Promise<AppSettings$1> {
  return appSettings.load();
}

/** SystemSettingsを上書き */
export async function setSystemSettings(
  settings: AppSettings$1
): Promise<AppSettings$1> {
  appSettings.save(settings);
  return settings;
}
