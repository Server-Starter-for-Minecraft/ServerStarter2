import { settingPath } from '../const';
import { AppSettingHandler } from '../file/systemSetting/handler';
import { AppSettings$1 } from '../file/systemSetting/schema/app';

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
