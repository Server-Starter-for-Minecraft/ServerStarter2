import Store from 'electron-store';
import { DEFAULT_MEMORY, DEFAULT_WORLD_CONTAINER, mainPath } from '../const';
import { SystemSettings } from 'src-electron/schema/system';
import { fix } from 'src-electron/util/fix';
import { objectFixer } from 'app/src-electron/util/detaFixer/fixer';
import { fixSystemSettings } from '../fixers/system';

export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  systemSettings.store = settings;
  return settings;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  // jsonの中身を修復してから返す
  const value = fixSystemSettings(systemSettings.store);
  systemSettings.store = value;
  return value;
}

export const systemSettings = new Store<SystemSettings>({
  cwd: mainPath.str(),
  name: 'serverstarter',
  fileExtension: 'json',
});
