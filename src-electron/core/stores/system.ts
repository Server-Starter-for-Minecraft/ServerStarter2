import Store from 'electron-store';
import { SystemSettings } from 'app/src-electron/api/schema';
import { mainPath } from '../const';
import { defaultServerProperties } from '../settings/properties';

export async function setSystemSettings(
  settings: SystemSettings
): Promise<undefined> {
  systemSettings.store = settings;
  return undefined
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return systemSettings.store;
}

export function fixSystemSettings() {
  const store = systemSettings.store;

  const fixed = fix<SystemSettings>(store, {
    container: { default: 'servers', custom: {} },
    player: { players: [], groups: [] },
    remote: { github: { accounts: [] } },
    world: { memory: 2, properties: defaultServerProperties },
  });

  systemSettings.store = fixed;
}

function fix<T extends { [x: string]: unknown }>(
  value: DeepPartial<T> | undefined,
  defaultValue: T
): T {
  if (value === undefined) return defaultValue;

  return Object.fromEntries(
    Object.entries(defaultValue).map(([k, v]) => {
      const val = value?.[k];
      if (typeof v === 'object' && v !== null) {
        return [
          k,
          fix(val as { [x: string]: unknown }, v as { [x: string]: unknown }),
        ];
      }
      return [k, val ?? v];
    })
  ) as T;
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> | undefined }
  : T;

export const systemSettings = new Store<SystemSettings>({
  cwd: mainPath.str(),
  name: 'serverstarter',
  fileExtension: 'json',
});

// 足りない情報を補完する
fixSystemSettings();
