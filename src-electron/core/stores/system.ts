import Store from 'electron-store';
import { mainPath } from '../const';
import { SystemSettings } from 'src-electron/schema/system';
import { fixSystemSettings } from '../fixers/system';
import { updateWorldContainers } from '../world/worldContainer';

export const systemSettings = new Store<SystemSettings>({
  cwd: mainPath.str(),
  name: 'serverstarter',
  fileExtension: 'json',
});

let systemSettingsValue = fixSystemSettings(systemSettings.store);
systemSettings.store = systemSettingsValue;

export async function getSystemSettings(): Promise<SystemSettings> {
  return systemSettingsValue;
}

/** SystemSettingsを上書き */
export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  // worldContainersの中身の変更に応じて、セーブデータを移動
  settings.container = await updateWorldContainers(
    systemSettingsValue.container,
    settings.container
  );

  systemSettingsValue = settings;

  systemSettings.store = settings;
  return settings;
}
